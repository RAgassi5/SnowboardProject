import { io } from 'socket.io-client';
import { API_BASE_URL, getStoredUser } from './api';

let socket = null;

/** Return the current socket instance (may be null if not connected). */
export const getSocket = () => socket;

/**
 * Connect to the Socket.IO server using the stored user's ID.
 * Idempotent — returns the existing socket if already connected.
 */
export const connectSocket = () => {
  const user = getStoredUser();
  if (!user?.userId) return null;
  if (socket?.connected) return socket;

  // Clean up a stale disconnected socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(API_BASE_URL, {
    auth:                  { userId: user.userId },
    reconnection:          true,
    reconnectionAttempts:  5,
    reconnectionDelay:     2000,
    transports:            ['websocket', 'polling']
  });

  socket.on('connect',       ()    => console.log('[Socket] connected:', socket.id));
  socket.on('disconnect',    (r)   => console.log('[Socket] disconnected:', r));
  socket.on('connect_error', (err) => console.warn('[Socket] error:', err.message));

  return socket;
};

/**
 * Disconnect and clear the socket singleton.
 * Call on logout or when leaving protected routes.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
