const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send("GET Request Called")
})

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://pawn-wars.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Store room information
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle room creation
  socket.on('create-room', ({ roomId, username }) => {
    rooms.set(roomId, {
      players: [{
        id: socket.id,
        username,
        color: 'white' // Creator is always white
      }],
      moves: []
    });

    socket.join(roomId);

    // Emit players-updated event for the first player
    io.to(roomId).emit('players-updated', rooms.get(roomId).players);

    console.log(`Room ${roomId} created by ${username}`);
  });


  // Handle room joining
  // Handle room joining
  socket.on('join-room', ({ roomId, username }) => {
    const room = rooms.get(roomId);

    if (room && room.players.length < 2) {
      room.players.push({
        id: socket.id,
        username,
        color: 'black' // Joiner is always black
      });

      socket.join(roomId);

      // Send initial data to both players
      io.to(roomId).emit('initial-data', {
        moves: room.moves,
        players: room.players
      });

      // Emit an update to all clients in the room about the players
      io.to(roomId).emit('players-updated', room.players);

      console.log(`${username} joined room ${roomId}`);
    }
  });


  // Handle chess moves
  socket.on('make-move', ({ roomId, from, to }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.moves.push({ from, to });
      // Broadcast the move to the opponent
      socket.to(roomId).emit('opponent-move', { from, to });
    }
  });

  // Handle chat messages
  socket.on('send-message', ({ roomId, username, message }) => {
    io.to(roomId).emit('chat-message', { username, message });
  });

  socket.on('request-initial-data', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      // Send move history and players list
      socket.emit('initial-data', {
        moves: room.moves,
        players: room.players
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        // If room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // Notify remaining player of the update
          io.to(roomId).emit('players-updated', room.players);
        }
      }
    });
    console.log('User disconnected:', socket.id);
  });

});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
