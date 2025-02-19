// src/services/socket.ts
import { io } from "socket.io-client";

// Create a single socket instance for the entire app
const socket = io(import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:5000", {
  withCredentials: true,
});


export default socket;