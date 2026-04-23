import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../apis/apiPath";
import { getToken } from "./auth";

// Socket.io connects to the server root, not the API path
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/i, "");

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export function connectSocket() {
  const token = getToken();
  if (!token || socket.connected) return;
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
