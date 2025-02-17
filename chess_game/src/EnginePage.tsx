import { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

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
        evaluation = mateMatch[1] === "0" ? 0 : mateMatch[1].startsWith("-") ? -9999 : 9999;
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
      findBestMove(); // Let Stockfish play first
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", textAlign: "center" }}>
      {/* Difficulty Selection */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        {Object.entries(levels).map(([levelName, depth]) => (
          <button
            key={levelName}
            style={{
              margin: "0.5rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "5px",
              backgroundColor: depth === stockfishLevel ? "#B58863" : "#f0d9b5",
            }}
            onClick={() => setStockfishLevel(depth)}
          >
            {levelName}
          </button>
        ))}
      </div>

      {/* Evaluation Bar */}
      <div style={{ height: "20px", backgroundColor: "#ccc", marginBottom: "1rem", position: "relative" }}>
        <div
          style={{
            width: `${(evaluation + 1000) / 20}%`,
            height: "100%",
            backgroundColor: evaluation > 0 ? "#4CAF50" : "#FF5722",
          }}
        ></div>
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          {evaluation > 9999 ? "M#" : evaluation < -9999 ? "#M" : evaluation}
        </span>
      </div>

      {/* Game Board */}
      <Chessboard
        id="PlayVsStockfish"
        position={gamePosition}
        onPieceDrop={onDrop}
        boardOrientation={playerColor}
      />

      {/* Game Status */}
      <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "1rem" }}>{gameStatus}</p>

      {/* Controls */}
      <div style={{ marginTop: "1rem" }}>
        <button
          style={{ margin: "0.5rem", padding: "0.5rem 1rem", borderRadius: "5px", backgroundColor: "#4CAF50", color: "white" }}
          onClick={() => startNewGame("white")}
        >
          Play as White
        </button>
        <button
          style={{ margin: "0.5rem", padding: "0.5rem 1rem", borderRadius: "5px", backgroundColor: "#000", color: "white" }}
          onClick={() => startNewGame("black")}
        >
          Play as Black
        </button>
        <button
          style={{ margin: "0.5rem", padding: "0.5rem 1rem", borderRadius: "5px", backgroundColor: "#FF5722", color: "white" }}
          onClick={() => {
            game.undo();
            game.undo();
            setGamePosition(game.fen());
            updateGameStatus();
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default EnginePage;
