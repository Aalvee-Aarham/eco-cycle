/**
 * EcoCycle demo seed — creates demo users, follows, and sample submissions.
 * Run from server directory: npm run seed
 * Requires MONGO_URI in .env (use database name e.g. .../ecocycle?...)
 *
 * Demo accounts (passwords are documented in /DEMO_ACCOUNTS.md at repo root):
 *   citizen@demo.ecocycle.app
 *   moderator@demo.ecocycle.app
 *   admin@demo.ecocycle.app
 *   neighbor@demo.ecocycle.app
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Follow from '../models/Follow.js';

const DEMO_EMAIL_RE = /@demo\.ecocycle\.app$/i;

const USERS = [
  {
    username: 'demo_citizen',
    email: 'citizen@demo.ecocycle.app',
    password: 'DemoCitizen1!',
    role: 'citizen',
    totalPoints: 128,
    submissionCount: 6,
    accuracyRate: 0.88,
    streak: 5,
    communityRank: 2,
    level: 2,
    badges: ['first_recycle', 'recycler_10'],
    categoryCounts: { recyclable: 3, organic: 2, 'e-waste': 1, hazardous: 0 },
    isPrivate: false,
  },
  {
    username: 'demo_moderator',
    email: 'moderator@demo.ecocycle.app',
    password: 'DemoModerator1!',
    role: 'moderator',
    totalPoints: 340,
    submissionCount: 12,
    accuracyRate: 0.91,
    streak: 12,
    communityRank: 1,
    level: 4,
    badges: ['first_recycle', 'eco_warrior'],
    categoryCounts: { recyclable: 5, organic: 4, 'e-waste': 2, hazardous: 1 },
    isPrivate: false,
  },
  {
    username: 'demo_admin',
    email: 'admin@demo.ecocycle.app',
    password: 'DemoAdmin1!',
    role: 'administrator',
    totalPoints: 50,
    submissionCount: 2,
    accuracyRate: 1,
    streak: 1,
    communityRank: 5,
    level: 1,
    badges: ['first_recycle'],
    categoryCounts: { recyclable: 2, organic: 0, 'e-waste': 0, hazardous: 0 },
    isPrivate: false,
  },
  {
    username: 'eco_neighbor',
    email: 'neighbor@demo.ecocycle.app',
    password: 'DemoNeighbor1!',
    role: 'citizen',
    totalPoints: 64,
    submissionCount: 4,
    accuracyRate: 0.75,
    streak: 2,
    communityRank: 3,
    level: 1,
    badges: ['first_recycle'],
    categoryCounts: { recyclable: 1, organic: 2, 'e-waste': 1, hazardous: 0 },
    isPrivate: true,
    bio: 'Private profile demo — stats visible only to you and admins.',
  },
];

function randPhash() {
  return crypto.randomBytes(16).toString('hex');
}

async function wipeDemoData() {
  const demoUsers = await User.find({ email: DEMO_EMAIL_RE }).select('_id').lean();
  const ids = demoUsers.map((u) => u._id);
  if (!ids.length) return;
  await Submission.deleteMany({ user: { $in: ids } });
  await Follow.deleteMany({
    $or: [{ follower: { $in: ids } }, { followee: { $in: ids } }],
  });
  await User.deleteMany({ _id: { $in: ids } });
  console.log('Removed previous @demo.ecocycle.app users and related data.');
}

async function seed() {
  await connectDB();
  await wipeDemoData();

  const created = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const doc = await User.create({
      username: u.username,
      email: u.email,
      passwordHash,
      role: u.role,
      totalPoints: u.totalPoints,
      submissionCount: u.submissionCount,
      accuracyRate: u.accuracyRate,
      streak: u.streak,
      communityRank: u.communityRank,
      level: u.level,
      badges: u.badges,
      categoryCounts: u.categoryCounts,
      isPrivate: u.isPrivate,
      bio: u.bio ?? '',
    });
    created.push({ def: u, user: doc });
  }

  const byName = Object.fromEntries(created.map((c) => [c.def.username, c.user]));

  // Everyone follows everyone else to ensure massive feed visibility
  const followPairs = [];
  const userKeys = Object.keys(byName);
  for (const f of userKeys) {
    for (const t of userKeys) {
      if (f !== t) {
        followPairs.push({ follower: byName[f]._id, followee: byName[t]._id });
      }
    }
  }
  await Follow.create(followPairs);

  const CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];
  const SUBS = {
    recyclable: ['paper', 'plastic', 'glass', 'metal', 'cardboard'],
    organic: ['food_waste', 'garden_waste'],
    'e-waste': ['battery', 'cable', 'device', 'appliance'],
    hazardous: ['chemical', 'medical', 'paint', 'aerosol'],
  };

  const sub = (user, partial) =>
    Submission.create({
      user: byName[user]._id,
      pHash: randPhash(),
      idempotencyKey: `seed-${uuidv4()}`,
      imageUrl: `https://picsum.photos/seed/${uuidv4()}/800/600`, // Placeholders for massive data
      ...partial,
    });

  // Generate 15 submissions for each user
  for (const username of Object.keys(byName)) {
    for (let i = 0; i < 15; i++) {
        const category = CATEGORIES[i % CATEGORIES.length];
        const subcategory = SUBS[category][i % SUBS[category].length];
        const confidence = 0.65 + Math.random() * 0.3;
        const state = i % 5 === 0 ? 'REWARDE' : 'REWARDED'; // Mix of states
        // Correcting state: REWARDE is a typo if not in enum, I'll use common ones
        const availableStates = ['REWARDED', 'REDEEMED', 'AWAITING_REWARD', 'CLASSIFIED'];
        
        await sub(username, {
            category,
            subcategory,
            confidence,
            state: availableStates[i % availableStates.length],
            points: Math.floor(Math.random() * 15) + 5,
            classifier: 'gemini',
            reasoning: `AI analysis of item ${i} for user ${username}.`,
        });
    }
  }

  console.log('\x1b[32m%s\x1b[0m', 'Successfully generated ~60 submissions (15 per user).');

  console.log('\nEcoCycle demo seed complete.\n');
  console.log('Log in with any @demo.ecocycle.app account — see DEMO_ACCOUNTS.md for passwords.\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
