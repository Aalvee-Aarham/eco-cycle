import AuditLog from '../models/AuditLog.js';

export const AuditService = {
  /**
   * Synchronous write-through — throws on failure as per spec.
   * "Deferred or asynchronous audit writes are not acceptable."
   */
  async write(event, metadata = {}, actorId = null, targetId = null, targetModel = null) {
    // This intentionally does NOT catch — failure here should bubble up
    // and abort the parent operation so no event goes unrecorded.
    await AuditLog.create({
      event,
      actor: actorId || undefined,
      target: targetId || undefined,
      targetModel: targetModel || undefined,
      metadata,
    });
  },

  async query({ event, actorId, targetId, limit = 50, skip = 0, from, to } = {}) {
    const filter = {};
    if (event) filter.event = event;
    if (actorId) filter.actor = actorId;
    if (targetId) filter.target = targetId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    return AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('actor', 'username role')
      .lean();
  },
};
