import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './LobbyPage';
import StockfishVsStockfish from './StockfishVsStockfish';
import GamePage from './GamePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/stockfishGame" element={<StockfishVsStockfish />} />
        <Route path="/game/:roomId" element={<GamePage />} />
      </Routes>
    </Router>
  );
};

export default App;