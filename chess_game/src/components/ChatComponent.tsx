import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface ChatComponentProps {
  socket: Socket | null;
  roomId: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ socket, roomId }) => {
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("chatHistory", (history) => {
      setChatHistory(history);
    });

    return () => {
      socket.off("chatHistory");
    };
  }, [socket]);

  const sendMessage = () => {
    if (!socket || !message.trim()) return;
    socket.emit("sendMessage", { roomId, message });
    setMessage("");
  };

  return (
    <div className="h-full flex flex-col text-white">
      <h2 className="text-lg font-bold mb-2">Chat</h2>
      <div className="flex-grow overflow-y-auto mb-2">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className="bg-gray-700 p-2 rounded mb-1">
            {msg}
          </div>
        ))}
      </div>
      <div className="mt-auto flex">
        <input
          className="flex-grow bg-gray-600 p-2 rounded-l text-white"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-500 p-2 rounded-r hover:bg-blue-600"
          onClick={sendMessage}
          disabled={!socket}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;
