import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

interface LobbyPageProps {
  setUsername: (username: string) => void;
  setRoomId: (roomId: string) => void;
  setPlayerColor: (color: 'white' | 'black') => void;
}

const LobbyPage: React.FC<LobbyPageProps> = ({ setUsername, setRoomId, setPlayerColor }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    if (!usernameInput) return;

    const newRoomId = Math.random().toString(36).substring(7);
    // Room creator always gets white pieces
    socket.emit('create-room', {
      roomId: newRoomId,
      username: usernameInput,
      color: 'white' // Fixed color for room creator
    });

    setUsername(usernameInput);
    setRoomId(newRoomId);
    setPlayerColor('white'); // Always set white for creator
    navigate(`/game/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!usernameInput || !roomInput) return;

    // Joining player always gets black pieces
    socket.emit('join-room', {
      roomId: roomInput,
      username: usernameInput,
      color: 'black' // Fixed color for joining player
    });

    setUsername(usernameInput);
    setRoomId(roomInput);
    setPlayerColor('black'); // Always set black for joiner
    navigate(`/game/${roomInput}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Chess Game Lobby</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={createRoom}
            disabled={!usernameInput}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create New Room (White Pieces)
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Enter room code"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={joinRoom}
            disabled={!usernameInput || !roomInput}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Room (Black Pieces)
          </button>
          <hr />
          <button
            onClick={() => navigate('/playEngine')}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >play VS engine</button>
            <button
            onClick={() => navigate('/stockfishVsStockfish')}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >stockfish Vs stockfish</button>
          
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;