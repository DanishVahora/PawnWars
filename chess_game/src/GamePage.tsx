import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const GamePage: React.FC = () => {
  const { roomId } = useParams();
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w"); // default "w"

  // Connect socket only once with useMemo
  const socket: Socket = useMemo(
    () =>
      io("http://localhost:5000", {
        withCredentials: true,
      }),
    []
  );

  useEffect(() => {
    // When connected, store socket ID
    socket.on("connect", () => {
      setSocketId(socket.id);
      console.log("Connected:", socket.id);
    });

    // Listen for when a second player joins or the server sends the players list
    socket.on("playerJoined", (players) => {
      // players is an object like: { socketId1: { username, color }, socketId2: { username, color } }
      if (players[socket.id]) {
        setPlayerColor(players[socket.id].color);
      }
    });

    // Update game state from server after each valid move
    socket.on("gameState", ({ fen, moveHistory }) => {
      setGame(new Chess(fen));
      setMoveHistory(moveHistory || []);
    });

    // If you also have a chatHistory event
    socket.on("chatHistory", (chatHistory) => {
      // handle chat updates here
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  // This function runs on dropping a piece
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // Only allow moves if it's your turn in your local game (optional)
    if (game.turn() !== playerColor) return false;

    // Attempt the move locally first
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };
    const tempGame = new Chess(game.fen());
    const result = tempGame.move(move);

    // If it's invalid, return false
    if (!result) return false;

    // Otherwise, update local board, then tell server
    setGame(tempGame);
    socket.emit("move", { roomId, move });
    return true;
  };

  return (
    <div className="flex">
      {/* Chessboard */}
      <div className="w-2/3 p-4">
        <Chessboard
          id="ChessBoard"
          position={game.fen()}
          onPieceDrop={onDrop}
          // Flip the board if you are black
          boardOrientation={playerColor === "w" ? "white" : "black"}
        />
      </div>

      {/* Move History (Right Sidebar) */}
      <div className="w-1/3 bg-gray-800 p-4 text-white">
        <h2 className="text-lg font-bold">Move History</h2>
        <ul>
          {moveHistory.map((move, index) => (
            <li key={index}>{move}</li>
          ))}
        </ul>

        {/* If you want a chat box, you can add it here */}
        <ChatComponent socket={socket} roomId={roomId!} />
      </div>
    </div>
  );
};

// Example Chat Component
const ChatComponent: React.FC<{ socket: Socket; roomId: string }> = ({
  socket,
  roomId,
}) => {
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("chatHistory", (history) => {
      setChatHistory(history);
    });
  }, [socket]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", { roomId, message });
    setMessage("");
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-2">Chat</h2>
      <div className="max-h-32 overflow-y-auto mb-2">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className="bg-gray-700 p-2 rounded mb-1">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-grow bg-gray-600 p-2 rounded-l"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="bg-blue-500 p-2 rounded-r"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GamePage;
