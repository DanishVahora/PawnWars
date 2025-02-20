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
    origin: "*" , 
    methods: ["GET", "POST"]
  }
});

// Store room information
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle room creation
  socket.on('create-room', ({ roomId, username, color }) => {
    rooms.set(roomId, {
      players: [{
        id: socket.id,
        username,
        color
      }],
      moves: []
    });
    
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${username}`);
  });

  // Handle room joining
  socket.on('join-room', ({ roomId, username, color }) => {
    const room = rooms.get(roomId);
    
    if (room && room.players.length < 2) {
      room.players.push({
        id: socket.id,
        username,
        color
      });
      
      socket.join(roomId);
      
      // Send initial data to the new player
      socket.emit('initial-data', {
        moves: room.moves,
        players: room.players
      });
      
      // Notify both players about the updated player list
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
    // Clean up rooms when players disconnect
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
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
