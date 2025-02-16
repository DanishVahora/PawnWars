const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const cors = require('cors');


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (username) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    rooms[roomId] = {
      players: { [socket.id]: username },
      game: new Chess(),
      whiteTime: 600,
      blackTime: 600,
      lastMoveTime: Date.now(),
      chatHistory: [],
      timer: null,
    };

    socket.join(roomId);
    socket.emit('roomCreated', roomId);

    socket.emit('gameState', {
      fen: rooms[roomId].game.fen(),
      whiteTime: rooms[roomId].whiteTime,
      blackTime: rooms[roomId].blackTime,
      started: false,
    });

    console.log(`Room ${ roomId } created by ${ username }`);
  });

  socket.on('joinRoom', (roomId, username) => {
    const room = rooms[roomId];

    if (room && Object.keys(room.players).length < 2) {
      room.players[socket.id] = username;
      socket.join(roomId);

      io.to(roomId).emit('playerJoined', Object.values(room.players));

      io.to(roomId).emit('gameState', {
        fen: room.game.fen(),
        whiteTime: room.whiteTime,
        blackTime: room.blackTime,
        started: Object.keys(room.players).length === 2,
      });
      io.to(roomId).emit('chatHistory', room.chatHistory);

      console.log(`${ username } joined room ${ roomId }`);

    } else {
      socket.emit('joinError', 'Room full or invalid');
    }
  });


});

app.use(
  cors({
    origin: "http://localhost:5174/",
    methods: ["GET", "POST"],
    credentials: true,
  },
  ))

server.listen(5000, () => console.log('Server running on port 5000'));