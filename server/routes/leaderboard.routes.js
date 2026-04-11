import { Router } from 'express';
import { LeaderboardService } from '../services/LeaderboardService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const board = await LeaderboardService.getTop(Number(limit));
    res.json(board);
  } catch (err) {
    next(err);
  }
});

export default router;
