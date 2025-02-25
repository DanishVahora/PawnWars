import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LobbyPage from './components/LobbyPage';
import GamePage from './components/GamePage';
import EnginePage from './components/EnginePage';
import StockfishVsStockfish from './components/StockfishVsStockfish';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  
  console.log("Id", roomId);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <LobbyPage 
              setUsername={setUsername}
              setRoomId={setRoomId}
              setPlayerColor={setPlayerColor}
            />
          } 
        />
        <Route 
          path="/game/:roomId" 
          element={
            username ? (
              <GamePage 
                username={username}
                playerColor={playerColor}
              />
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/playEngine" 
          element={
            <EnginePage></EnginePage>
          } 
        />
        <Route 
          path="/EngineVsEngine" 
          element={
            <StockfishVsStockfish></StockfishVsStockfish>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;