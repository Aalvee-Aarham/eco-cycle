import { getRedis } from '../config/redis.js';
import { hammingDistance } from '../utils/phash.js';
import { getConfig } from '../config/system.config.js';

export const FraudService = {
  async check(userId, pHash) {
    const config = getConfig();
    const redis = getRedis();
    const windowSeconds = config.FRAUD_WINDOW_MINUTES * 60;
    const key = `fraud:${userId}`;

    if (redis.status !== 'ready') {
      return false;
    }

    try {
      // Get recent hashes for this user
      const recentHashes = await redis.lrange(key, 0, -1);

      for (const stored of recentHashes) {
        const dist = hammingDistance(pHash, stored);
        if (dist < config.PHASH_HAMMING_THRESHOLD) {
          return true; // Duplicate detected
        }
      }

      // Store new hash with window TTL
      await redis.lpush(key, pHash);
      await redis.expire(key, windowSeconds);
      await redis.ltrim(key, 0, 49); // Keep last 50
    } catch (err) {
      console.warn('FraudService: Redis call failed, skipping fraud detection check.');
    }

    return false;
  },
};
