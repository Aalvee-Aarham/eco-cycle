import api from './axios';

export const adminApi = {
  audit: (params) => api.get('/admin/audit', { params }).then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  getConfig: () => api.get('/admin/config').then((r) => r.data),
  setConfig: (key, value) => api.patch('/admin/config', { key, value }).then((r) => r.data),
  stats: () => api.get('/admin/stats').then((r) => r.data),
};
