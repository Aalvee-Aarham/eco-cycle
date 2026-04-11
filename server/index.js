import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { getRedis } from './config/redis.js';
import { loadConfig } from './config/system.config.js';
import { initSocket } from './sockets/leaderboard.socket.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await loadConfig();

  // Connect Redis (non-blocking)
  const redis = getRedis();
  redis.connect().catch(() => console.warn('Redis not available — some features degraded'));

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  initSocket(io);

  // Make io accessible from services
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`EcoCycle server running on port ${PORT}`);
    console.log(`Classifier: ${process.env.CLASSIFIER || 'gemini'}`);
  });
}

start().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
