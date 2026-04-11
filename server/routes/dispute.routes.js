import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { DisputeService } from '../services/DisputeService.js';
import { AuditService } from '../services/AuditService.js';
import Submission from '../models/Submission.js';

const router = Router();

// GET /api/disputes/queue — Moderator+
router.get('/queue', auth, requireRole('moderator'), async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const queue = await Submission.find({ state: 'IN_DISPUTE' })
      .sort({ createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('user', 'username email totalPoints submissionCount')
      .lean();
    const total = await Submission.countDocuments({ state: 'IN_DISPUTE' });
    res.json({ queue, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/disputes/:id/audit — Moderator: inspect audit entries for a specific submission
// Spec: "inspect audit entries for submissions under review"
router.get('/:id/audit', auth, requireRole('moderator'), async (req, res, next) => {
  try {
    const sub = await Submission.findById(req.params.id).lean();
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Fetch all audit events related to this specific submission
    const logs = await AuditService.query({
      targetId: req.params.id,
      limit: 100,
    });

    // Also fetch events recorded in metadata.submissionId
    const metaLogs = await (await import('../models/AuditLog.js')).default
      .find({ 'metadata.submissionId': sub._id })
      .sort({ createdAt: 1 })
      .populate('actor', 'username role')
      .lean();

    // Merge and deduplicate by _id
    const all = [...logs, ...metaLogs];
    const seen = new Set();
    const merged = all.filter((l) => {
      const id = String(l._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({ submission: sub, auditTrail: merged });
  } catch (err) {
    next(err);
  }
});

// POST /api/disputes/:id/resolve — Moderator+
router.post('/:id/resolve', auth, requireRole('moderator'), async (req, res, next) => {
  try {
    const { category, outcome } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });

    const VALID = ['recyclable', 'organic', 'e-waste', 'hazardous'];
    if (!VALID.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID.join(', ')}` });
    }

    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (sub.state !== 'IN_DISPUTE') {
      return res.status(422).json({ error: 'Submission is not IN_DISPUTE', currentState: sub.state });
    }

    const resolved = await DisputeService.resolveManual(sub, req.user._id, category, outcome);
    res.json({ submission: resolved });
  } catch (err) {
    next(err);
  }
});

// GET /api/disputes/stats — Moderator: overview of dispute states
router.get('/stats', auth, requireRole('moderator'), async (req, res, next) => {
  try {
    const stats = await Submission.aggregate([
      { $match: { state: { $in: ['IN_DISPUTE', 'RESOLVED_AUTO', 'RESOLVED_MANUAL', 'FLAGGED'] } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
    ]);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
