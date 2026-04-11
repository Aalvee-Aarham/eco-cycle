import api from './axios';

export const leaderboardApi = {
  get: (limit = 50) => api.get('/leaderboard', { params: { limit } }).then((r) => r.data),
};
