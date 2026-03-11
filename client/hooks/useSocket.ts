'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      socketRef.current = connectSocket(token);
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [token]);

  const emit = useCallback((event: string, data: any) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const socket = getSocket();
    if (socket) {
      socket.on(event, callback);
    }
    return () => {
      socket?.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    const socket = getSocket();
    if (socket) {
      socket.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    disconnect: disconnectSocket,
  };
};
