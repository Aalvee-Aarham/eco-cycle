import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', code: 'MISSING_TOKEN' });
    }
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', code: 'USER_NOT_FOUND' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', code: 'INVALID_TOKEN' });
  }
}
