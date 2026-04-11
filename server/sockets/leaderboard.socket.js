import { LeaderboardService } from '../services/LeaderboardService.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';

let _io = null;

export function initSocket(io) {
  _io = io;

  io.on('connection', (socket) => {
    socket.on('subscribe:leaderboard', async () => {
      socket.join('leaderboard');
      try {
        const board = await LeaderboardService.getTop(20);
        socket.emit('leaderboard:update', board);
      } catch {}
    });

    socket.on('subscribe:feed', (userId) => {
      if (userId) socket.join(`feed:${userId}`);
    });

    socket.on('unsubscribe:leaderboard', () => socket.leave('leaderboard'));
    socket.on('unsubscribe:feed', (userId) => {
      if (userId) socket.leave(`feed:${userId}`);
    });
  });

  // Refresh leaderboard every 55s
  setInterval(async () => {
    try {
      const board = await LeaderboardService.refreshFromDB(20);
      io.to('leaderboard').emit('leaderboard:update', board);
    } catch {}
  }, 55000);
}

export async function broadcastSubmission(submission, followeeId) {
  if (!_io) return;
  try {
    const user = await User.findById(followeeId).select('username isPrivate').lean();
    if (!user || user.isPrivate) return;

    const followers = await Follow.find({ followee: followeeId }).select('follower').lean();
    followers.forEach(({ follower }) => {
      _io.to(`feed:${follower}`).emit('feed:new', {
        submission,
        user: { _id: followeeId, username: user.username },
      });
    });

    // Also refresh leaderboard room
    LeaderboardService.getTop(20).then((board) => {
      _io.to('leaderboard').emit('leaderboard:update', board);
    }).catch(() => {});
  } catch {}
}
