import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Typewriter } from 'react-simple-typewriter';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="max-w-3xl w-full text-center mb-8">
        <h1 className="text-8xl font-bold mb-4 text-yellow-400 tracking-wide">PawnWars</h1>
        <div className="text-2xl font-bold mb-4 text-white-400 tracking-wide flex justify-center">
          <p >Life is simple :  </p>
          <Typewriter
            words={[' Eat', ' Sleep', ' PlayChess', ' Repeat!']}
            loop={15}
            cursor
            cursorStyle='..'
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1000}

          />
        </div>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-300">Game Lobby</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />

          <button
            onClick={createRoom}
            disabled={!usernameInput}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Create New Room (White Pieces)
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Enter room code"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />

          <button
            onClick={joinRoom}
            disabled={!usernameInput || !roomInput}
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Join Room (Black Pieces)
          </button>

          <div className="pt-4 border-t border-gray-600 mt-4">
            <h3 className="text-xl font-semibold mb-4 text-yellow-300 text-center">Practice Options</h3>
            <button
              onClick={() => navigate('/playEngine')}
              className="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700 transition-colors font-semibold mb-3"
            >
              Play vs Computer
            </button>
            <button
              onClick={() => navigate('/EngineVsEngine')}
              className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 transition-colors font-semibold"
            >
              Watch Computer vs Computer
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-gray-400 text-sm">
        Created by Danish Vahora
      </div>
    </div>
  );
};

export default LobbyPage;