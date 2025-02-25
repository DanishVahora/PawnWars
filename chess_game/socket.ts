// src/services/socket.ts
import { io } from "socket.io-client";

// Create a single socket instance for the entire app
const socket = io("http://localhost:3001", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});



export default socket;
