import api from './axios';

export const socialApi = {
  feed: (params) => api.get('/social/feed', { params }).then((r) => r.data),
  follow: (userId) => api.post(`/social/follow/${userId}`).then((r) => r.data),
  unfollow: (userId) => api.delete(`/social/follow/${userId}`).then((r) => r.data),
  profile: (username) => api.get(`/social/profile/${username}`).then((r) => r.data),
  privacy: (isPrivate) => api.patch('/social/privacy', { isPrivate }).then((r) => r.data),
  updateProfile: (data) => api.patch('/social/profile', data).then((r) => r.data),
  followers: () => api.get('/social/followers').then((r) => r.data),
  following: () => api.get('/social/following').then((r) => r.data),
};
