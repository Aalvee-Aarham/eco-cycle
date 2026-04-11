import Follow from '../models/Follow.js';
import Submission from '../models/Submission.js';

export const FeedService = {
  async getFeed(userId, { limit = 20, skip = 0 } = {}) {
    const follows = await Follow.find({ follower: userId }).select('followee').lean();
    const followedIds = follows.map((f) => f.followee);
    if (followedIds.length === 0) return [];

    const submissions = await Submission.find({
      user: { $in: followedIds },
      state: { $in: ['REWARDED', 'REDEEMED'] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      // Spec: feed must include category, confidence score, points awarded
      .select('user category subcategory confidence points state createdAt classifier imageUrl')
      .populate('user', 'username avatar isPrivate totalPoints communityRank')
      .lean();

    // Privacy enforcement: private profiles must NOT appear in feeds
    return submissions.filter((s) => !s.user?.isPrivate);
  },

  async getFollowers(userId) {
    return Follow.find({ followee: userId })
      .populate('follower', 'username avatar totalPoints communityRank isPrivate')
      .lean();
  },

  async getFollowing(userId) {
    return Follow.find({ follower: userId })
      .populate('followee', 'username avatar totalPoints communityRank isPrivate')
      .lean();
  },
};
