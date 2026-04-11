import crypto from 'crypto';

export function generateIdempotencyKey(submissionId, userId, action) {
  return crypto
    .createHash('sha256')
    .update(`${submissionId}:${userId}:${action}`)
    .digest('hex');
}
