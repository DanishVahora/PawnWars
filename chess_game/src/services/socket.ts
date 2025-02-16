// src/services/socket.ts
import { io } from "socket.io-client";

// Create a single socket instance for the entire app
const socket = io("http://localhost:5000", {
  withCredentials: true,
});

export default socket;