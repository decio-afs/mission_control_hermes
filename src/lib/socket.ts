import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_VPS_WS_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(WS_BASE_URL, {
        auth: { token: API_KEY },
        transports: ['websocket'],
        path: '/socket.io/',
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket.io] Connected to VPS Gateway');
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('[Socket.io] Disconnected: ', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket.io] Connection Error: ', error.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
