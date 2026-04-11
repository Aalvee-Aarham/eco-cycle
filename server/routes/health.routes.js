import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import mongoose from 'mongoose';
import { getRedis } from '../config/redis.js';

const router = Router();

router.get('/', auth, requireRole('administrator'), async (req, res) => {
  const redis = getRedis();
  let redisStatus = 'ok';
  try {
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'error',
    redis: redisStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      classifier: process.env.CLASSIFIER || 'gemini',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
