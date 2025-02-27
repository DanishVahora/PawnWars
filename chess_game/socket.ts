// src/services/socket.ts
import { io } from "socket.io-client";

// Create a single socket instance for the entire app
const socket = io(`${process.env.REACT_APP_API_URL}`, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});



export default socket;
