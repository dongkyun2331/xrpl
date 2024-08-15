const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");

const app = express();

const options = {
  key: fs.readFileSync("./privkey.pem"),
  cert: fs.readFileSync("./fullchain.pem"),
};

app.use(
  cors({
    origin: "https://forixrpl.vercel.app/",
    methods: ["GET", "POST"],
  })
);

const server = https.createServer(options, app);
const io = new Server(server, {
  cors: {
    origin: "https://forixrpl.vercel.app/",
    methods: ["GET", "POST"],
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

const port = 3001;

server.listen(port, () => {
  console.log(`${port}`);
});
