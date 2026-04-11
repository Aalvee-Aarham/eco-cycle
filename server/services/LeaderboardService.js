import { getRedis } from '../config/redis.js';
import User from '../models/User.js';
import { getConfig } from '../config/system.config.js';

export const LeaderboardService = {
  async getTop(n = 20) {
    const redis = getRedis();
    let entries = [];
    try {
      entries = await redis.zrevrange('leaderboard', 0, n - 1, 'WITHSCORES');
    } catch {}

    if (!entries || entries.length === 0) {
      return this.refreshFromDB(n);
    }

    const result = [];
    for (let i = 0; i < entries.length; i += 2) {
      const userId = entries[i];
      const score = parseInt(entries[i + 1]);
      try {
        const user = await User.findById(userId)
          .select('username avatar role totalPoints submissionCount level streak badges')
          .lean();
        if (user) {
          result.push({ ...user, totalPoints: score, rank: result.length + 1 });
        }
      } catch {}
    }
    return result;
  },

  async refreshFromDB(n = 20) {
    const users = await User.find({})
      .sort({ totalPoints: -1 })
      .limit(n)
      .select('username avatar role totalPoints submissionCount level streak badges')
      .lean();

    // Update communityRank on each user
    const rankUpdates = users.map((u, i) =>
      User.findByIdAndUpdate(u._id, { communityRank: i + 1 })
    );
    await Promise.allSettled(rankUpdates);

    // Push to Redis
    try {
      const redis = getRedis();
      const config = getConfig();
      const pipeline = redis.pipeline();
      users.forEach((u) => pipeline.zadd('leaderboard', u.totalPoints, String(u._id)));
      pipeline.expire('leaderboard', config.LEADERBOARD_TTL_SECONDS || 55);
      await pipeline.exec();
    } catch {}

    return users.map((u, i) => ({ ...u, rank: i + 1 }));
  },

  async updateUserScore(userId, points) {
    try {
      const redis = getRedis();
      await redis.zadd('leaderboard', points, String(userId));
    } catch {}
  },
};
