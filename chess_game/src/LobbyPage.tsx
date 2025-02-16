import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const LobbyPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    socket.emit('createRoom', username);
    socket.on('roomCreated', (roomId: string) => {
      navigate(`/game/${roomId}`);
    });
  };

  const handleJoinRoom = () => {
    if (!username || !roomId) {
      setError('Please enter a username and room ID');
      return;
    }
    socket.emit('joinRoom', roomId, username);
    socket.on('playerJoined', () => {
      navigate(`/game/${roomId}`);
    });
    socket.on('joinError', (message: string) => {
      setError(message);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Chess Lobby</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Room ID (if joining)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition duration-300 mb-2"
        >
          Create Room
        </button>
        <button
          onClick={handleJoinRoom}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition duration-300"
        >
          Join Room
        </button>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LobbyPage;