const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const mysql = require("mysql2/promise");
const { Wallet, Client } = require("xrpl"); // xrpl 라이브러리 추가
require("dotenv").config();

const app = express();

const options = {
  key: fs.readFileSync("./privkey.pem"),
  cert: fs.readFileSync("./fullchain.pem"),
};

// CORS 설정: 정확한 출처를 허용하도록 수정
app.use(
  cors({
    origin: "https://forixrpl.vercel.app", // 끝에 슬래시 제거
    methods: ["GET", "POST"],
    credentials: true, // 쿠키를 사용한 인증이 필요한 경우에만 필요
  })
);

// JSON 바디 파서 추가 (POST 요청에서 바디 데이터를 읽기 위해 필요)
app.use(express.json());

// MySQL 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// API 엔드포인트: /api/getNickname
app.post("/api/getNickname", async (req, res) => {
  const { nickname, address } = req.body;

  if (!nickname && !address) {
    return res
      .status(400)
      .json({ message: "Nickname and address are required" });
  }

  try {
    // MySQL 데이터베이스에 연결
    const connection = await mysql.createConnection(dbConfig);

    if (address && !nickname) {
      // 닉네임 조회
      const [rows] = await connection.execute(
        "SELECT nickname FROM nicknames WHERE address = ?",
        [address]
      );

      if (rows.length > 0) {
        await connection.end();
        return res.status(200).json({ nickname: rows[0].nickname });
      } else {
        await connection.end();
        return res.status(404).json({ message: "Nickname not found" });
      }
    } else if (nickname && address) {
      // 닉네임 중복 검사 및 업데이트 또는 삽입
      const [rows] = await connection.execute(
        "SELECT address FROM nicknames WHERE address = ?",
        [address]
      );

      if (rows.length > 0) {
        // 이미 존재하는 경우 업데이트
        await connection.execute(
          "UPDATE nicknames SET nickname = ? WHERE address = ?",
          [nickname, address]
        );
        await connection.end();
        return res
          .status(200)
          .json({ message: "Nickname updated successfully" });
      } else {
        // 존재하지 않는 경우 새로 삽입
        await connection.execute(
          "INSERT INTO nicknames (address, nickname) VALUES (?, ?)",
          [address, nickname]
        );
        await connection.end();
        return res.status(200).json({ message: "Nickname saved successfully" });
      }
    }
  } catch (error) {
    console.error("Database error:", error); // 오류 로그 출력
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
});

// API 엔드포인트: /api/createWallet
app.post("/api/createWallet", async (req, res) => {
  const client = new Client("wss://s.altnet.rippletest.net:51233", {
    connectionTimeout: 10000,
  });

  try {
    await client.connect();

    const wallet = Wallet.generate();
    const response = await client.fundWallet(wallet);

    res.status(200).json({
      address: wallet.classicAddress,
      secret: wallet.seed,
      balance: response.balance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.disconnect();
  }
});

// WebSocket 서버 설정
const server = https.createServer(options, app);
const io = new Server(server, {
  cors: {
    origin: "https://forixrpl.vercel.app", // 끝에 슬래시 제거
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
