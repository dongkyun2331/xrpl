const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const { Wallet, Client } = require("xrpl");
const { XummSdk } = require("xumm-sdk");

require("dotenv").config();

const app = express();
const NICKNAME_FILE = "./nicknames.json"; // 닉네임을 저장할 파일 경로

const options = {
  key: fs.readFileSync("./privkey.pem"),
  cert: fs.readFileSync("./fullchain.pem"),
};

app.use(
  cors({
    origin: ["https://forixrpl.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

const Sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);

// JSON 파일에서 닉네임 데이터를 불러오는 함수
const loadNicknames = () => {
  if (fs.existsSync(NICKNAME_FILE)) {
    const data = fs.readFileSync(NICKNAME_FILE);
    return JSON.parse(data);
  } else {
    return {};
  }
};

// JSON 파일에 닉네임 데이터를 저장하는 함수
const saveNicknames = (nicknames) => {
  fs.writeFileSync(NICKNAME_FILE, JSON.stringify(nicknames, null, 2));
};

app.get("/api/readme", (req, res) => {
  const readmePath = path.join(__dirname, "README.md");
  fs.readFile(readmePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Could not read README.md file.");
    }
    res.send(data);
  });
});

app.post("/api/xumm-login", async (req, res) => {
  try {
    const payload = {
      txjson: {
        TransactionType: "SignIn",
      },
    };

    const xummPayload = await Sdk.payload.create(payload);

    res.json({
      qrCode: xummPayload.refs.qr_png,
      loginUrl: xummPayload.next.always,
      uuid: xummPayload.uuid,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to initiate XUMM login", error: error.message });
  }
});

app.get("/api/xumm-callback", async (req, res) => {
  const { uuid } = req.query;

  try {
    const xummPayload = await Sdk.payload.get(uuid);

    if (xummPayload.meta.signed === true) {
      const walletAddress = xummPayload.response.account;
      res.json({ success: true, walletAddress });
    } else {
      res.json({ success: false, message: "User declined the request." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to handle XUMM callback",
      error: error.message,
    });
  }
});

app.post("/api/getNickname", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }

  try {
    const nicknames = loadNicknames();
    const nickname = nicknames[address];

    if (nickname) {
      return res.status(200).json({ nickname });
    } else {
      return res.status(404).json({ message: "Nickname not found" });
    }
  } catch (error) {
    console.error("Error fetching nickname:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
});

app.post("/api/saveNickname", async (req, res) => {
  const { nickname, address } = req.body;

  if (!nickname || !address) {
    return res
      .status(400)
      .json({ message: "Nickname and address are required" });
  }

  try {
    const nicknames = loadNicknames();
    nicknames[address] = nickname;
    saveNicknames(nicknames);

    return res.status(200).json({ message: "Nickname saved successfully" });
  } catch (error) {
    console.error("Error saving nickname:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
});

app.post("/api/createWallet", async (req, res) => {
  const { network } = req.body;

  let serverUrl;
  let faucetUrl;

  if (network === "testnet") {
    serverUrl = "wss://s.altnet.rippletest.net:51233";
    faucetUrl = "https://faucet.altnet.rippletest.net/accounts";
  } else if (network === "devnet") {
    serverUrl = "wss://s.devnet.rippletest.net:51233";
    faucetUrl = "https://faucet.devnet.rippletest.net/accounts";
  } else {
    serverUrl = "wss://s1.ripple.com";
  }

  const client = new Client(serverUrl, {
    connectionTimeout: 10000,
  });

  try {
    await client.connect();

    const wallet = Wallet.generate();

    let balance = "0";

    if (network === "testnet" || network === "devnet") {
      const faucetResponse = await fetch(faucetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destination: wallet.classicAddress }),
      });

      if (!faucetResponse.ok) {
        throw new Error("Failed to fund wallet from faucet");
      }

      const faucetData = await faucetResponse.json();
      balance = faucetData.account.balance;
    }

    res.status(200).json({
      address: wallet.classicAddress,
      secret: wallet.seed,
      balance: balance,
      network,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.disconnect();
  }
});

app.post("/api/sendXRP", async (req, res) => {
  const { address, amount } = req.body;

  try {
    const payload = {
      txjson: {
        TransactionType: "Payment",
        Destination: address, // 사용자가 입력한 XRP 주소
        Amount: (amount * 1000000).toString(), // XRP 수량을 Drops 단위로 변환
      },
    };

    const xummPayload = await Sdk.payload.create(payload);

    res.json({
      qrCode: xummPayload.refs.qr_png,
      approvalUrl: xummPayload.next.always,
      uuid: xummPayload.uuid,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create XRP transaction",
      error: error.message,
    });
  }
});

const server = https.createServer(options, app);
const io = new Server(server, {
  cors: {
    origin: ["https://forixrpl.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let players = {};

io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);

  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    direction: "down",
    nickname: "",
  };

  io.emit("currentPlayers", players);
  socket.emit("newPlayer", players);

  socket.on("move", (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].direction = movementData.direction;
      io.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("setNickname", (nickname) => {
    if (players[socket.id]) {
      players[socket.id].nickname = nickname;
      io.emit("playerNicknameSet", players[socket.id]);
    }
  });

  socket.on("sendMessage", (message) => {
    io.emit("receiveMessage", {
      user: players[socket.id].nickname,
      text: message,
    });
    io.emit("chatMessage", { playerId: socket.id, message });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected: " + socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
