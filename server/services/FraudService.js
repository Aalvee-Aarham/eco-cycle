import { getRedis } from '../config/redis.js';
import { hammingDistance } from '../utils/phash.js';
import { getConfig } from '../config/system.config.js';
import Submission from '../models/Submission.js';

export const FraudService = {
  async check(userId, pHash) {
    const config = getConfig();
    const threshold = config.PHASH_HAMMING_THRESHOLD;

    // --- Primary check: MongoDB (always reliable) ---
    // Find existing non-flagged submissions for this user that have a pHash stored.
    // Use exact match first for speed, then fall back to fuzzy Hamming check.
    try {
      const existing = await Submission.find(
        { user: userId, pHash: { $exists: true, $ne: '' }, state: { $nin: ['FLAGGED'] } },
        { pHash: 1 },
        { lean: true }
      ).limit(100);

      for (const sub of existing) {
        const dist = hammingDistance(pHash, sub.pHash);
        if (dist < threshold) {
          return true; // Duplicate detected via DB
        }
      }
    } catch (err) {
      console.warn('FraudService: MongoDB pHash check failed:', err.message);
    }

    // --- Secondary check: Redis (fast, windowed, best-effort) ---
    try {
      const redis = getRedis();
      if (redis.status === 'ready') {
        const windowSeconds = config.FRAUD_WINDOW_MINUTES * 60;
        const key = `fraud:${userId}`;
        const recentHashes = await redis.lrange(key, 0, -1);

        for (const stored of recentHashes) {
          const dist = hammingDistance(pHash, stored);
          if (dist < threshold) {
            return true; // Duplicate detected via Redis
          }
        }

        // Store new hash with window TTL
        await redis.lpush(key, pHash);
        await redis.expire(key, windowSeconds);
        await redis.ltrim(key, 0, 49); // Keep last 50
      }
    } catch (err) {
      console.warn('FraudService: Redis call failed, skipping Redis fraud check.');
    }

    return false;
  },
};
