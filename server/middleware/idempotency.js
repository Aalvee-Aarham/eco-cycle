import { getRedis } from '../config/redis.js';
import { getConfig } from '../config/system.config.js';

/**
 * Spec: "Idempotency key validation must occur before any processing begins."
 * This middleware runs before the route handler. If a cached response exists,
 * it returns immediately. Otherwise, it attaches helpers to req for caching.
 */
export async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code: 'MISSING_IDEMPOTENCY_KEY',
      message: 'Header Idempotency-Key is required',
    });
  }

  if (typeof key !== 'string' || key.length < 8 || key.length > 128) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code: 'INVALID_IDEMPOTENCY_KEY',
      message: 'Idempotency-Key must be 8-128 characters',
    });
  }

  const redisKey = `idempotency:${req.user?._id}:${key}`;
  const config = getConfig();

  try {
    const redis = getRedis();
    if (redis.status !== 'ready') {
      throw new Error('Redis not ready');
    }
    // Validation + cache lookup BEFORE any processing
    const cached = await redis.get(redisKey);
    if (cached) {
      // Return cached response — idempotent
      res.setHeader('X-Idempotency-Replayed', 'true');
      return res.status(200).json(JSON.parse(cached));
    }

    req.idempotencyKey = key;
    req.cacheIdempotency = async (responseBody) => {
      try {
        await redis.set(redisKey, JSON.stringify(responseBody), 'EX', config.IDEMPOTENCY_TTL_SECONDS || 86400);
      } catch {}
    };
    next();
  } catch {
    // Redis unavailable — still allow through but no caching
    req.idempotencyKey = key;
    req.cacheIdempotency = async () => {};
    next();
  }
}
