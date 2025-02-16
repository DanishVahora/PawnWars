
import React, { useState, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";

const GamePage: React.FC = () => {
  const [socketId, setSocketId] = useState<string | null>(null);

  const socket: Socket = useMemo(
    () =>
      io("http://localhost:5000", {
        withCredentials: true,
      }),
    []
  );

  useEffect(() => {
    const handleConnect = () => {
      setSocketId(socket.id ?? null); 
      console.log("Connected:", socket.id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect); 
    };
  }, [socket]);

  return <>Both are on the same Room {socketId}</>;
};

export default GamePage;
