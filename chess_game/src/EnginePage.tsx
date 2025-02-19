import { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Link } from "react-router-dom";

class Engine {
  private stockfish: Worker;

  constructor() {
    this.stockfish = new Worker("./stockfish.js");
  }

  onMessage(callback: (data: { bestMove?: string; eval?: number }) => void) {
    this.stockfish.addEventListener("message", (e) => {
      const bestMove = e.data?.match(/bestmove\s+(\S+)/)?.[1];
      const evalMatch = e.data?.match(/cp\s+(-?\d+)/); // Centipawn score
      const mateMatch = e.data?.match(/mate\s+(-?\d+)/); // Mate score

      let evaluation: number | undefined = evalMatch ? parseInt(evalMatch[1], 10) : undefined;

      if (mateMatch) {
        // If mate is detected, set a large positive or negative value
        // so we can differentiate it in the UI.
        if (mateMatch[1] === "0") {
          evaluation = 0; // immediate mate
        } else {
          evaluation = mateMatch[1].startsWith("-") ? -9999 : 9999;
        }
      }

      callback({ bestMove, eval: evaluation });
    });
  }

  evaluatePosition(fen: string, depth: number) {
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage(`go depth ${depth}`);
  }

  stop() {
    this.stockfish.postMessage("stop");
  }

  quit() {
    this.stockfish.postMessage("quit");
  }
}

const EnginePage: React.FC = () => {
  const levels: Record<string, number> = {
    "Easy 🤓": 2,
    "Medium 🧐": 8,
    "Hard 😵": 18,
  };

  const engine = useMemo(() => new Engine(), []);
  const game = useMemo(() => new Chess(), []);

  const [gamePosition, setGamePosition] = useState<string>(game.fen());
  const [stockfishLevel, setStockfishLevel] = useState<number>(2);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [evaluation, setEvaluation] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>("Game in progress...");

  useEffect(() => {
    return () => {
      engine.quit();
    };
  }, [engine]);

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus("Checkmate! Game Over.");
    } else if (game.isDraw()) {
      setGameStatus("It's a Draw!");
    } else if (game.isCheck()) {
      setGameStatus("Check!");
    } else {
      setGameStatus("Game in progress...");
    }
  };

  const findBestMove = () => {
    engine.evaluatePosition(game.fen(), stockfishLevel);
    engine.onMessage(({ bestMove, eval: evalValue }) => {
      if (evalValue !== undefined) {
        setEvaluation(evalValue);
      }

      if (bestMove) {
        game.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.substring(4, 5) || "q",
        });
        setGamePosition(game.fen());
        updateGameStatus();
      }
    });
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() || "q",
    });

    if (!move) return false;

    setGamePosition(game.fen());
    updateGameStatus();

    if (!game.isGameOver()) {
      findBestMove();
    }

    return true;
  };

  const startNewGame = (color: "white" | "black") => {
    game.reset();
    setGamePosition(game.fen());
    setPlayerColor(color);
    setEvaluation(0);
    setGameStatus("Game in progress...");

    if (color === "black") {
      // Let Stockfish move first
      findBestMove();
    }
  };

  // Helper to clamp eval to a range so the bar doesn't overflow
  const clampEval = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  // Convert the evaluation into a 0–100 percentage for the bar
  // We'll allow -1000 to +1000 for the bar extremes
  const EVAL_MIN = -1000;
  const EVAL_MAX = 1000;
  const clampedValue = clampEval(evaluation, EVAL_MIN, EVAL_MAX);
  const percentage = ((clampedValue - EVAL_MIN) / (EVAL_MAX - EVAL_MIN)) * 100;

  // What to display in the middle of the bar
  const displayEval =
    evaluation > 9999 ? "M#" : evaluation < -9999 ? "#M" : evaluation;

    return (
      <div className="min-h-screen p-4 bg-gray-900 text-white">
        <div className="mb-6 text-center">
          <h1 className="text-6xl font-bold mb-2 text-yellow-400 tracking-wide">PawnWars</h1>
          <h2 className="text-2xl">Play vs Computer</h2>
        </div>
  
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Controls Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[600px] flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-yellow-300">Game Controls</h2>
              <div className="flex-grow overflow-auto mb-4 p-4 border border-gray-700 rounded-md bg-gray-900">
                <div className="space-y-4">
                  <h3 className="font-bold text-yellow-300">Difficulty</h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(levels).map(([levelName, depth]) => (
                      <button
                        key={levelName}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          depth === stockfishLevel
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                        onClick={() => setStockfishLevel(depth)}
                      >
                        {levelName}
                      </button>
                    ))}
                  </div>
  
                  <h3 className="font-bold text-yellow-300 mt-6">Evaluation</h3>
                  <div className="w-full h-6 bg-gray-700 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 ${
                        clampedValue >= 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      {displayEval}
                    </span>
                  </div>
  
                  <h3 className="font-bold text-yellow-300 mt-6">Game Status</h3>
                  <p className="text-gray-300">{gameStatus}</p>
                </div>
              </div>
  
              <div className="flex flex-col gap-2">
                <button
                  className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-bold"
                  onClick={() => startNewGame("white")}
                >
                  Play as White
                </button>
                <button
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-bold border border-white"
                  onClick={() => startNewGame("black")}
                >
                  Play as Black
                </button>
                <button
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
                  onClick={() => {
                    game.undo();
                    game.undo();
                    setGamePosition(game.fen());
                    updateGameStatus();
                  }}
                >
                  Undo Move
                </button>
              </div>
            </div>
          </div>
  
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Chessboard
                  id="PlayVsStockfish"
                  position={gamePosition}
                  onPieceDrop={onDrop}
                  boardOrientation={playerColor}
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
                {game.history().map((move, index) => (
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
  };

export default EnginePage;