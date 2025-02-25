// src/services/socket.ts
import { io } from "socket.io-client";

// Create a single socket instance for the entire app
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});



export default socket;
