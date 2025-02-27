// src/services/socket.ts
import { io } from "socket.io-client";

console.log(import.meta.env.VITE_API_URL);
// Create a single socket instance for the entire app
const socket = io(`${import.meta.env.VITE_API_URL}`, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});



export default socket;
