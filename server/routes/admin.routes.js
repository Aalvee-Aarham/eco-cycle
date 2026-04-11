import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { AuditService } from '../services/AuditService.js';
import { getConfig, setConfigValue } from '../config/system.config.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';

const router = Router();

router.use(auth, requireRole('administrator'));

// GET /api/admin/audit
router.get('/audit', async (req, res, next) => {
  try {
    const { event, actorId, limit = 50, skip = 0, from, to } = req.query;
    const logs = await AuditService.query({ event, actorId, limit: Number(limit), skip: Number(skip), from, to });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['citizen', 'moderator', 'administrator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    await AuditService.write('ROLE_CHANGED', { userId: req.params.id, newRole: role }, req.user._id, user._id, 'User');
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/config
router.get('/config', async (req, res) => {
  res.json(getConfig());
});

// PATCH /api/admin/config
router.patch('/config', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    const config = await setConfigValue(key, value, req.user._id);
    await AuditService.write('CONFIG_UPDATED', { key, value }, req.user._id);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    const total = await User.countDocuments();
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalSubmissions, stateBreakdown] = await Promise.all([
      User.countDocuments(),
      Submission.countDocuments(),
      Submission.aggregate([{ $group: { _id: '$state', count: { $sum: 1 } } }]),
    ]);
    res.json({ totalUsers, totalSubmissions, stateBreakdown });
  } catch (err) {
    next(err);
  }
});

export default router;
