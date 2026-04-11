import Redis from 'ioredis';

let redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 0, // Stop immediately on request failure if disconnected
      retryStrategy: (times) => {
        if (times > 1) {
          console.warn('Redis connection failed. Reconnection disabled to avoid console spam.');
          return null; // Stop retrying
        }
        return 50; // Try once more after 50ms
      },
    });
    redis.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        // Log only once via retryStrategy warning
      } else {
        console.error('Redis error:', err);
      }
    });
    redis.on('connect', () => console.log('Redis connected'));
  }
  return redis;
}
