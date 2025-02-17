import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const LobbyPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [color, setColor] = useState<'white' | 'black'>('white');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    socket.emit('createRoom', { username, color });
    socket.on('roomCreated', (roomId: string) => {
      navigate(`/game/${roomId}`);
    });
  };

  const handleJoinRoom = () => {
    if (!username || !roomId) {
      setError('Please enter a username and room ID');
      return;
    }
    socket.emit('joinRoom', { roomId, username, color });
    socket.on('playerJoined', () => {
      navigate(`/game/${roomId}`);
    });
    socket.on('joinError', (message: string) => {
      setError(message);
    });
  };

  const handleWatch = () => {
    navigate('/stockfishGame');
  };

  const handleEngine = () => {
    navigate(`/enginePage?color=${color}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="bg-gray-800 p-10 rounded-lg shadow-2xl w-[600px] text-center">
        <h1 className="text-3xl font-bold mb-6">Chess Lobby</h1>
        
        {/* Room Controls */}
        <div className="mb-6 p-6 bg-gray-700 rounded-lg">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Room ID (if joining)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={handleCreateRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
            >
              Create Room
            </button>
            <button
              onClick={handleJoinRoom}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
            >
              Join Room
            </button>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setColor('white')}
              className={`py-2 px-4 rounded-md transition duration-300 ${color === 'white' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
              Play as White
            </button>
            <button
              onClick={() => setColor('black')}
              className={`py-2 px-4 rounded-md transition duration-300 ${color === 'black' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
              Play as Black
            </button>
          </div>
        </div>

        {/* Engine Section */}
        <div className="p-6 bg-gray-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Engine Matches</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleWatch}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-md transition duration-300"
            >
              Watch Engine vs Engine
            </button>
            <button
              onClick={handleEngine}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-md transition duration-300"
            >
              Play vs Engine ({color})
            </button>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LobbyPage;
