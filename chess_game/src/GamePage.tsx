import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../socket';

interface GamePageProps {
  username: string;
  playerColor: 'white' | 'black';
}

interface ChatMessage {
  username: string;
  message: string;
}

interface MoveHistory {
  move: string;
  fen: string;
  moveNumber: number;
}

const GamePage: React.FC<GamePageProps> = ({ username, playerColor }) => {
  const { roomId } = useParams();
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [opponent, setOpponent] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('opponent-joined', ({ username: opponentName }) => {
      setOpponent(opponentName);
    });

    socket.on('opponent-move', ({ from, to }) => {
      const gameCopy = new Chess(game.fen());
      gameCopy.move({ from, to, promotion: 'q' });
      setGame(gameCopy);
      updateMoveHistory(gameCopy);
      updateGameStatus(gameCopy);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });

    return () => {
      socket.off('opponent-joined');
      socket.off('opponent-move');
      socket.off('chat-message');
    };
  }, [game]);

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus('Checkmate! ' + (currentGame.turn() === 'w' ? 'Black' : 'White') + ' wins!');
    } else if (currentGame.isDraw()) {
      setGameStatus('Game Draw!');
    } else if (currentGame.isCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('');
    }
  };

  const updateMoveHistory = (currentGame: Chess) => {
    const history = currentGame.history({ verbose: true });
    const moves = history.map((move, index) => ({
      move: `${Math.floor(index / 2) + 1}. ${move.san}`,
      fen: move.after,
      moveNumber: index + 1
    }));
    setMoveHistory(moves);
  };

  function onSquareClick(square: string) {
    // Get a list of possible moves
    const moves = game.moves({
      square,
      verbose: true
    });

    if (moveFrom === '') {
      // No piece is selected yet
      if (moves.length > 0) {
        setMoveFrom(square);
        setPossibleMoves(moves.map((move: any) => move.to));
      }
    } else {
      // Attempt to make the move
      const move = game.move({ from: moveFrom, to: square, promotion: 'q' });
      if (move) {
        socket.emit('make-move', {
          roomId,
          from: moveFrom,
          to: square
        });
        const newGame = new Chess(game.fen());
        setGame(newGame);
        updateMoveHistory(newGame);
        updateGameStatus(newGame);
      }
      // Clear selected square and possible moves
      setMoveFrom('');
      setPossibleMoves([]);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (game.turn() !== playerColor[0]) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      socket.emit('make-move', {
        roomId,
        from: sourceSquare,
        to: targetSquare
      });

      const newGame = new Chess(game.fen());
      setGame(newGame);
      updateMoveHistory(newGame);
      updateGameStatus(newGame);
      setMoveFrom('');
      setPossibleMoves([]);
      return true;
    } catch (error) {
      return false;
    }
  }

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const chatMessage = {
      username,
      message: messageInput.trim()
    };

    socket.emit('send-message', { roomId, ...chatMessage });
    setChatMessages(prev => [...prev, chatMessage]);
    setMessageInput('');
  };

  const customSquareStyles = () => {
    const styles: { [square: string]: { backgroundColor: string } } = {};
    
    // Highlight possible moves
    possibleMoves.forEach(square => {
      styles[square] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    });
    
    // Highlight selected square
    if (moveFrom) {
      styles[moveFrom] = { backgroundColor: 'rgba(255, 165, 0, 0.4)' };
    }
    
    // Highlight check
    if (game.isCheck()) {
      const king = game.board().reduce((acc, row, i) => {
        const j = row.findIndex(piece => 
          piece && piece.type === 'k' && piece.color === game.turn()
        );
        return j >= 0 ? `${String.fromCharCode(97 + j)}${8 - i}` : acc;
      }, '');
      if (king) {
        styles[king] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
      }
    }
    
    return styles;
  };

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      {/* Header with Logo */}
      <div className="mb-6 text-center">
        <h1 className="text-6xl font-bold mb-2 text-yellow-400 tracking-wide">PawnWars</h1>
        <h2 className="text-2xl">Multiplayer Match</h2>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chat Section - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-yellow-300">Chat</h2>
            <div className="flex-grow overflow-auto mb-4 p-4 border border-gray-700 rounded-md bg-gray-900" ref={chatRef}>
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`mb-2 ${msg.username === username ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  <span className="font-bold">{msg.username}: </span>
                  {msg.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-grow p-2 border rounded bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Chess Board - Center */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-300">
                {opponent && playerColor === 'black' ? opponent : username} (Black)
              </h2>
              {gameStatus && (
                <div className="text-red-400 font-bold">{gameStatus}</div>
              )}
            </div>
            
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                boardOrientation={playerColor}
                customSquareStyles={customSquareStyles()}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  border: "2px solid #4a5568"
                }}
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-300">
                {opponent && playerColor === 'white' ? opponent : username} (White)
              </h2>
              <div className="text-gray-400">
                Room: {roomId}
              </div>
            </div>
          </div>
        </div>

        {/* Move History - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[600px] overflow-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-300">Move History</h2>
            <div className="space-y-2">
              {moveHistory.map((move, index) => (
                <div 
                  key={index}
                  className="p-2 hover:bg-gray-700 rounded text-gray-300"
                >
                  {move.move}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Lobby Link and Footer */}
      <div className="mt-6 text-center">
        <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors mb-4 inline-block">
          Back to Lobby
        </Link>
        <div className="text-gray-400 text-sm mt-4">
          Created by Danish
        </div>
      </div>
    </div>
  );
};

export default GamePage;