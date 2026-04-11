const ROLE_HIERARCHY = { citizen: 1, moderator: 2, administrator: 3 };

export const requireRole = (...roles) => (req, res, next) => {
  const minLevel = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] ?? 99));
  const userLevel = ROLE_HIERARCHY[req.user?.role] ?? 0;
  if (userLevel < minLevel) {
    return res.status(403).json({ error: 'FORBIDDEN', code: 'INSUFFICIENT_ROLE' });
  }
  next();
};
