import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { idempotency } from '../middleware/idempotency.js';
import upload from '../middleware/upload.js';
import { ClassificationService } from '../services/ClassificationService.js';
import { RewardService } from '../services/RewardService.js';
import Submission from '../models/Submission.js';

const router = Router();

// POST /api/submissions
router.post(
  '/',
  auth,
  requireRole('citizen'),
  idempotency,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Image file required' });
      }

      const { classifierOverride } = req.body;
      const { submission, flagged } = await ClassificationService.classify(
        req.user._id,
        req.file.buffer,
        req.file.mimetype,
        classifierOverride,
        req.idempotencyKey
      );

      const body = { submission, flagged };
      await req.cacheIdempotency(body);
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/submissions/:id
router.get('/:id', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const sub = await Submission.findById(req.params.id).populate('user', 'username').populate('resolvedBy', 'username');
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Citizens can only see their own; mods/admins can see all
    const isOwner = String(sub.user._id) === String(req.user._id);
    const isPrivileged = ['moderator', 'administrator'].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// GET /api/submissions (own submissions list)
router.get('/', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const submissions = await Submission.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

// POST /api/submissions/:id/redeem
router.post('/:id/redeem', auth, requireRole('citizen'), async (req, res, next) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (String(sub.user) !== String(req.user._id)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const reward = await RewardService.redeem(sub, req.user._id);
    res.json({ reward, submission: sub });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/submissions/:id
router.delete('/:id', auth, requireRole('administrator'), async (req, res, next) => {
  try {
    const sub = await Submission.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    
    // Attempt to update total points / remove points if they were rewarded, but this might be complex.
    // For now, hard delete is requested.
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
