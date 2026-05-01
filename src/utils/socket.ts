import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../apis/apiPath";

// Socket.io connects to the server root, not the API path
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/i, "");

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export function connectSocket() {
  if (socket.connected) return;
  socket.connect();
}

/** After cookie-based token refresh, handshake again so the server reads the new access cookie. */
export function reconnectSocketWithLatestAuth() {
  if (socket.connected) socket.disconnect();
  socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
