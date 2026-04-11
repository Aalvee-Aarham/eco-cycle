import { create } from 'zustand';
import { io } from 'socket.io-client';

let socket = null;

export const useSocketStore = create((set) => ({
  leaderboard: [],
  setLeaderboard: (data) => set({ leaderboard: data }),
}));

export function useSocketInit() {
  const url = import.meta.env.VITE_SOCKET_URL;
  if (!url) return;
  if (socket) return;
  socket = io(url, { transports: ['websocket'] });
  socket.on('connect', () => {
    socket.emit('subscribe:leaderboard');
  });
  socket.on('leaderboard:update', (data) => {
    useSocketStore.getState().setLeaderboard(data);
  });
}
