import api from './axios';

export const disputesApi = {
  queue: (params) => api.get('/disputes/queue', { params }).then((r) => r.data),
  stats: () => api.get('/disputes/stats').then((r) => r.data),
  audit: (id) => api.get(`/disputes/${id}/audit`).then((r) => r.data),
  resolve: (id, body) => api.post(`/disputes/${id}/resolve`, body).then((r) => r.data),
};
