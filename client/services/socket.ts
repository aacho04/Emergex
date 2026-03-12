import { io, Socket } from 'socket.io-client';

const FALLBACK_SOCKET_URL = 'https://emergex.onrender.com';

const resolveSocketUrl = () => {
  const envBase = process.env.NEXT_PUBLIC_SOCKET_URL || FALLBACK_SOCKET_URL;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (envBase.startsWith(origin)) {
      return FALLBACK_SOCKET_URL;
    }
  }
  return envBase;
};

const SOCKET_URL = resolveSocketUrl();

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };
