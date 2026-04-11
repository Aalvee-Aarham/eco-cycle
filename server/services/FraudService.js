import { hammingDistance } from '../utils/phash.js';
import { getConfig } from '../config/system.config.js';
import Submission from '../models/Submission.js';

export const FraudService = {
  async check(userId, pHash) {
    const config = getConfig();
    const threshold = config.PHASH_HAMMING_THRESHOLD;

    // MongoDB-based duplicate detection — reliable, no Redis dependency.
    // Fetch all non-flagged submissions for this user that have a stored pHash
    // and compare via perceptual Hamming distance.
    try {
      const existing = await Submission.find(
        { user: userId, pHash: { $exists: true, $ne: '' }, state: { $nin: ['FLAGGED'] } },
        { pHash: 1 },
        { lean: true }
      ).limit(100);

      for (const sub of existing) {
        const dist = hammingDistance(pHash, sub.pHash);
        if (dist < threshold) {
          return true; // Duplicate detected
        }
      }
    } catch (err) {
      console.warn('FraudService: MongoDB pHash check failed:', err.message);
    }

    return false;
  },
};
