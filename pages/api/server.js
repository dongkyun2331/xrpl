import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Setting up socket.io");

    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      console.log("a user connected: " + socket.id);

      // Define the players object to hold player data
      let players = {};

      // When a player connects, add them to the players object
      players[socket.id] = {
        id: socket.id,
        x: 0,
        y: 0,
        direction: "down",
        nickname: "",
      };

      io.emit("currentPlayers", players);
      socket.emit("newPlayer", players);

      // When a player moves, update their position and direction
      socket.on("move", (movementData) => {
        if (players[socket.id]) {
          players[socket.id].x = movementData.x;
          players[socket.id].y = movementData.y;
          players[socket.id].direction = movementData.direction;
          io.emit("playerMoved", players[socket.id]);
        }
      });

      // When a player sets a nickname, update it in the players object
      socket.on("setNickname", (nickname) => {
        if (players[socket.id]) {
          players[socket.id].nickname = nickname;
          io.emit("playerNicknameSet", players[socket.id]);
        }
      });

      // When a player sends a chat message, broadcast it to all players
      socket.on("sendMessage", (message) => {
        io.emit("receiveMessage", {
          user: players[socket.id].nickname || "Unknown",
          text: message,
        });
      });

      // When a player disconnects, remove them from the players object
      socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        delete players[socket.id];
        io.emit("playerDisconnected", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.io is already running");
  }
  res.end();
}
