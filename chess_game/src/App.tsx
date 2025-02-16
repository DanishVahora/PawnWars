import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './LobbyPage';
import GamePage from './GamePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
      </Routes>
    </Router>
  );
};

export default App;