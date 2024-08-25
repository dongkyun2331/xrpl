const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const mysql = require("mysql2/promise");
const { Wallet, Client } = require("xrpl");
require("dotenv").config();

const app = express();

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

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

app.post("/api/getNickname", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT nickname FROM nicknames WHERE address = ?",
      [address]
    );

    if (rows.length > 0) {
      return res.status(200).json({ nickname: rows[0].nickname });
    } else {
      return res.status(404).json({ message: "Nickname not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
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
    const connection = await mysql.createConnection(dbConfig);

    const [existingRows] = await connection.execute(
      "SELECT * FROM nicknames WHERE address = ?",
      [address]
    );

    if (existingRows.length > 0) {
      await connection.execute(
        "UPDATE nicknames SET nickname = ? WHERE address = ?",
        [nickname, address]
      );
      return res.status(200).json({ message: "Nickname updated successfully" });
    } else {
      await connection.execute(
        "INSERT INTO nicknames (address, nickname) VALUES (?, ?)",
        [address, nickname]
      );
      return res.status(200).json({ message: "Nickname saved successfully" });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

app.post("/api/createWallet", async (req, res) => {
  const { network } = req.body; // 요청 본문에서 네트워크 선택 (메인넷 또는 테스트넷)

  const serverUrl =
    network === "testnet"
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://s1.ripple.com";

  const client = new Client(serverUrl, {
    connectionTimeout: 10000,
  });

  try {
    await client.connect();

    const wallet = Wallet.generate();

    let balance = "0";

    if (network === "testnet") {
      // 테스트넷 계정 생성 시 초기 자금 지원
      const response = await client.fundWallet(wallet);
      balance = response.balance; // 테스트넷에서 제공받은 초기 잔액
    }

    res.status(200).json({
      address: wallet.classicAddress,
      secret: wallet.seed,
      balance: balance, // 초기 잔액 반환 (테스트넷의 경우 자금 지원 후 잔액)
      network, // 선택한 네트워크를 반환
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.disconnect();
  }
});

const server = https.createServer(options, app);
const io = new Server(server, {
  cors: {
    origin: "https://forixrpl.vercel.app",
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
