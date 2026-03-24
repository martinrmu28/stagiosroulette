'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(playerName?: string, avatar?: string, roomCode?: string): Socket {
  if (!socket || socket.disconnected) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || `http://${hostname}:3001`;
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { playerName, avatar, roomCode },
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getExistingSocket(): Socket | null {
  return socket;
}
