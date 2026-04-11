import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { FeedService } from '../services/FeedService.js';
import { AuditService } from '../services/AuditService.js';

const router = Router();

// POST /api/social/follow/:userId
router.post('/follow/:userId', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const follow = await Follow.create({ follower: req.user._id, followee: userId });

    // Spec: social actions must be audit logged
    await AuditService.write('USER_FOLLOWED', { followeeId: userId, followeeUsername: target.username }, req.user._id, target._id, 'User');

    res.status(201).json({ follow });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Already following' });
    next(err);
  }
});

// DELETE /api/social/follow/:userId
router.delete('/follow/:userId', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.userId).select('username');
    await Follow.findOneAndDelete({ follower: req.user._id, followee: req.params.userId });

    // Spec: social actions must be audit logged
    await AuditService.write('USER_UNFOLLOWED', { followeeId: req.params.userId, followeeUsername: target?.username }, req.user._id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/social/feed
// Spec: shows category, confidence score, points awarded from followed accounts
router.get('/feed', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const feed = await FeedService.getFeed(req.user._id, { limit: Number(limit), skip: Number(skip) });
    res.json(feed);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/social/profile — update own profile (e.g. bio)
router.patch('/profile', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const { bio } = req.body;
    if (bio !== undefined) {
      req.user.bio = String(bio).slice(0, 200);
      await req.user.save();
    }
    res.json(req.user.toPublicJSON());
  } catch (err) {
    next(err);
  }
});

// GET /api/social/profile/:username
// Spec: public profiles show username, totalPoints, submissionCount, accuracyRate, communityRank
// Private profiles are only accessible to the user themselves and administrators
router.get('/profile/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash -email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let requestingUser = null;
    const token = req.headers.authorization?.slice(7);
    if (token) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requestingUser = await User.findById(decoded.id).select('role _id');
      } catch {}
    }

    const isSelf = requestingUser && String(requestingUser._id) === String(user._id);
    const isAdmin = requestingUser?.role === 'administrator';

    // Spec: private profiles — full data only for the owner and administrators
    if (user.isPrivate && !isSelf && !isAdmin) {
      return res.json({
        _id: user._id,
        username: user.username,
        isPrivate: true,
        communityRank: user.communityRank,
      });
    }

    const followers = await Follow.countDocuments({ followee: user._id });
    const following = await Follow.countDocuments({ follower: user._id });

    res.json({
      ...user.toObject(),
      followersCount: followers,
      followingCount: following,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/social/privacy
router.patch('/privacy', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const { isPrivate } = req.body;
    req.user.isPrivate = Boolean(isPrivate);
    await req.user.save();
    await AuditService.write('PRIVACY_CHANGED', { isPrivate }, req.user._id, req.user._id, 'User');
    res.json({ isPrivate: req.user.isPrivate });
  } catch (err) {
    next(err);
  }
});

// GET /api/social/followers
router.get('/followers', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const followers = await FeedService.getFollowers(req.user._id);
    res.json(followers);
  } catch (err) {
    next(err);
  }
});

// GET /api/social/following
router.get('/following', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const following = await FeedService.getFollowing(req.user._id);
    res.json(following);
  } catch (err) {
    next(err);
  }
});

export default router;
