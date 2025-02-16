const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");
const cors = require("cors");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", (username) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = {
      players: {
        // store username and color = 'w'
        [socket.id]: { username, color: "w" },
      },
      game: new Chess(),
      whiteTime: 600,
      blackTime: 600,
      lastMoveTime: Date.now(),
      moveHistory: [],
      chatHistory: [],
    };

    socket.join(roomId);

    // Let the creator know the room was created
    socket.emit("roomCreated", roomId);

    // Send initial game state to the creator
    socket.emit("gameState", {
      fen: rooms[roomId].game.fen(),
      whiteTime: rooms[roomId].whiteTime,
      blackTime: rooms[roomId].blackTime,
      started: false,
    });

    console.log(`Room ${roomId} created by ${username}`);
  });

  socket.on("joinRoom", (roomId, username) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("joinError", "Room doesn't exist");
      return;
    }
    // If room is valid and has fewer than 2 players
    if (Object.keys(room.players).length < 2) {
      // Assign black to the second player
      room.players[socket.id] = { username, color: "b" };
      socket.join(roomId);

      // Notify everyone in the room that a second player joined
      io.to(roomId).emit("playerJoined", room.players);

      // Send updated game state to everyone in the room
      io.to(roomId).emit("gameState", {
        fen: room.game.fen(),
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
        started: true,
      });
      io.to(roomId).emit("chatHistory", room.chatHistory);

      console.log(`${username} joined room ${roomId}`);
    } else {
      socket.emit("joinError", "Room full or invalid");
    }
  });

  // Handle moves from a client
  socket.on("move", ({ roomId, move }) => {
    const room = rooms[roomId];
    if (!room) return;

    const game = room.game;
    const result = game.move(move);

    // If the move is valid
    if (result) {
      // Add SAN notation (e.g. "e4", "Nf3") to moveHistory
      room.moveHistory.push(result.san);
      room.lastMoveTime = Date.now();

      // Broadcast the new FEN and move history to everyone
      io.to(roomId).emit("gameState", {
        fen: game.fen(),
        moveHistory: room.moveHistory,
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
      });
    }
  });

  // Chat
  socket.on("sendMessage", ({ roomId, message }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.chatHistory.push(message);
    io.to(roomId).emit("chatHistory", room.chatHistory);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
