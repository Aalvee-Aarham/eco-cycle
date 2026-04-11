import api from './axios';
import { generateIdempotencyKey } from '@/lib/idempotency';

export const submissionsApi = {
  classify: (imageFile, classifierOverride) => {
    const form = new FormData();
    form.append('image', imageFile);
    if (classifierOverride) form.append('classifierOverride', classifierOverride);
    return api
      .post('/submissions', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': generateIdempotencyKey(),
        },
      })
      .then((r) => r.data);
  },
  list: (params) => api.get('/submissions', { params }).then((r) => r.data),
  get: (id) => api.get(`/submissions/${id}`).then((r) => r.data),
  redeem: (id) => api.post(`/submissions/${id}/redeem`).then((r) => r.data),
};
