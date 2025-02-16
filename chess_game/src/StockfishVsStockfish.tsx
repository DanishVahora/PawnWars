import { useState, useMemo, useEffect } from "react";
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
  const [chessBoardPosition, setChessBoardPosition] = useState(game.fen());

  function findBestMove() {
    engine.evaluatePosition(game.fen(), 10);
    engine.onMessage(({ bestMove }) => {
      if (bestMove) {
        game.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.substring(4, 5),
        });

        setChessBoardPosition(game.fen());
      }
    });
  }

  useEffect(() => {
    if (!game.isGameOver() || game.isDraw()) {
      setTimeout(findBestMove, 300);
    }
  }, [chessBoardPosition]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-center mb-6">Stockfish vs Stockfish</h1>
        <div className="flex justify-center">
          <Chessboard
            position={chessBoardPosition}
            boardWidth={600} // Adjust the board size as needed
          />
        </div>
      </div>
    </div>
  );
}

export default StockfishVsStockfish;