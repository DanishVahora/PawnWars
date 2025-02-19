import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

// Define a simple Engine class that uses a Stockfish worker
class Engine {
  stockfish: Worker;
  onMessage: (callback: (data: { bestMove: string | undefined }) => void) => void;

  constructor() {
    this.stockfish = new Worker("./stockfish.js");
    this.onMessage = (callback: (data: { bestMove: string | undefined }) => void) => {
      this.stockfish.addEventListener("message", (e) => {
        const bestMove = e.data?.match(/bestmove\s+(\S+)/)?.[1];
        callback({ bestMove });
      });
    };
    // Init engine
    // this.sendMessage("uci");
    // this.sendMessage("isready");
  }

  evaluatePosition(fen: string, depth: number) {
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage(`go depth ${depth}`);
  }

  stop() {
    this.stockfish.postMessage("stop"); // Run when changing positions
  }

  quit() {
    this.stockfish.postMessage("quit"); // Good to run this before unmounting.
  }
}

function StockfishVsStockfish() {
  const engine = useMemo(() => new Engine(), []);
  const game = useMemo(() => new Chess(), []);
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState("Game in progress...");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus("Checkmate! Game Over.");
    } else if (currentGame.isDraw()) {
      setGameStatus("Game Draw!");
    } else if (currentGame.isCheck()) {
      setGameStatus("Check!");
    } else {
      setGameStatus("Game in progress...");
    }
  };

  const updateMoveHistory = (currentGame: Chess) => {
    const history = currentGame.history();
    setMoveHistory(history);
  };

  function findBestMove() {
    engine.evaluatePosition(game.fen(), 10);
    engine.onMessage(({ bestMove }) => {
      if (bestMove) {
        game.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.substring(4, 5),
        });

        setGamePosition(game.fen());
        updateGameStatus(game);
        updateMoveHistory(game);
      }
    });
  }

  useEffect(() => {
    if (!game.isGameOver() || game.isDraw()) {
      setTimeout(findBestMove, 300);
    }
    return () => {
      engine.quit();
    };
  }, [gamePosition]);

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      <div className="mb-6 text-center">
        <h1 className="text-6xl font-bold mb-2 text-yellow-400 tracking-wide">PawnWars</h1>
        <h2 className="text-2xl">Computer vs Computer</h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Statistics Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-yellow-300">Game Info</h2>
            <div className="flex-grow overflow-auto mb-4 p-4 border border-gray-700 rounded-md bg-gray-900">
              <p>Engine Depth: 10</p>
              <p>Move Delay: 300ms</p>
              <p className="mt-4 font-bold">{gameStatus}</p>
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Chessboard
                position={gamePosition}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  border: "2px solid #4a5568"
                }}
              />
            </div>
          </div>
        </div>

        {/* Move History */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[600px] overflow-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-300">Move History</h2>
            <div className="space-y-2">
              {moveHistory.map((move, index) => (
                <div 
                  key={index}
                  className="p-2 hover:bg-gray-700 rounded text-gray-300 font-mono"
                >
                  {Math.floor(index / 2) + 1}. {move}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors mb-4 inline-block">
          Return to Lobby
        </Link>
        <div className="text-gray-400 text-sm mt-4">
          Created by Danish Vahora
        </div>
      </div>
    </div>
  );
}

export default StockfishVsStockfish;