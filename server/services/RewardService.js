import mongoose from 'mongoose';
import Reward from '../models/Reward.js';
import User, { BADGES } from '../models/User.js';
import { generateIdempotencyKey } from '../utils/idempotencyKey.js';
import { AuditService } from './AuditService.js';
import { getRedis } from '../config/redis.js';
import { broadcastSubmission } from '../sockets/leaderboard.socket.js';

const POINTS_MAP = {
  recyclable: 10,
  organic: 8,
  'e-waste': 15,
  hazardous: 12,
};

const STREAK_BONUS = {
  3:  1.1,
  7:  1.25,
  14: 1.5,
  30: 2.0,
};

function getStreakMultiplier(streak) {
  let multiplier = 1.0;
  for (const [days, mult] of Object.entries(STREAK_BONUS)) {
    if (streak >= Number(days)) multiplier = mult;
  }
  return multiplier;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function computeStreak(user) {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  if (user.lastSubmitDate === today) {
    return { streak: user.streak, lastSubmitDate: today };
  } else if (user.lastSubmitDate === yesterday) {
    return { streak: user.streak + 1, lastSubmitDate: today };
  } else {
    return { streak: 1, lastSubmitDate: today };
  }
}

function computeBadges(user) {
  const earned = new Set(user.badges || []);
  const counts = user.categoryCounts || {};
  for (const badge of BADGES) {
    if (earned.has(badge.id)) continue;
    if (badge.category && badge.threshold) {
      if ((counts[badge.category] || 0) >= badge.threshold) earned.add(badge.id);
    }
    if (badge.streakDays && user.streak >= badge.streakDays) earned.add(badge.id);
    if (badge.totalPoints && user.totalPoints >= badge.totalPoints) earned.add(badge.id);
  }
  return [...earned];
}

export const RewardService = {
  async award(submission) {
    const idempotencyKey = generateIdempotencyKey(submission._id, submission.user, 'award');
    const existing = await Reward.findOne({ idempotencyKey });
    if (existing) return existing;

    const basePoints = POINTS_MAP[submission.category] || 10;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findById(submission.user).session(session);
      if (!user) throw new Error('User not found');

      const { streak, lastSubmitDate } = computeStreak(user);
      const multiplier = getStreakMultiplier(streak);
      const points = Math.round(basePoints * multiplier);

      user.totalPoints += points;
      user.submissionCount += 1;
      user.streak = streak;
      user.longestStreak = Math.max(user.longestStreak || 0, streak);
      user.lastSubmitDate = lastSubmitDate;

      if (!user.categoryCounts) user.categoryCounts = {};
      user.categoryCounts[submission.category] = (user.categoryCounts[submission.category] || 0) + 1;

      if (submission.confidence >= 0.72) {
        user.highConfCount = (user.highConfCount || 0) + 1;
      }
      user.accuracyRate = Math.round((user.highConfCount / user.submissionCount) * 100);
      user.level = Math.min(10, Math.floor(user.totalPoints / 100) + 1);
      user.badges = computeBadges(user);
      await user.save({ session });

      const reward = await Reward.create([{
        submission: submission._id,
        user: submission.user,
        points,
        action: 'award',
        idempotencyKey,
      }], { session });

      submission.points = points;
      submission.state = 'REWARDED';
      await submission.save({ session });

      await session.commitTransaction();

      // Redis leaderboard
      try {
        const redis = getRedis();
        await redis.zadd('leaderboard', user.totalPoints, String(user._id));
      } catch {}

      // Socket.IO broadcast
      try { await broadcastSubmission(submission, submission.user); } catch {}

      await AuditService.write('REWARD_AWARDED', {
        submissionId: submission._id, points, basePoints, multiplier,
        streak, level: user.level, badges: user.badges,
      }, submission.user);

      return reward[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async redeem(submission, userId) {
    if (submission.state !== 'REWARDED') {
      const err = new Error('Submission not in REWARDED state');
      err.status = 400;
      throw err;
    }
    const idempotencyKey = generateIdempotencyKey(submission._id, userId, 'redeem');
    const existing = await Reward.findOne({ idempotencyKey });
    if (existing) return existing;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const reward = await Reward.create([{
        submission: submission._id,
        user: userId,
        points: -submission.points,
        action: 'redeem',
        idempotencyKey,
      }], { session });

      submission.state = 'REDEEMED';
      await submission.save({ session });

      await session.commitTransaction();
      await AuditService.write('REWARD_REDEEMED', { submissionId: submission._id }, userId);
      return reward[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
