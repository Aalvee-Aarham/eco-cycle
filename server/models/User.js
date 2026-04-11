import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BADGES = [
  { id: 'first_recycle',   label: 'First Recycle',     threshold: 1,   category: 'recyclable' },
  { id: 'recycler_10',     label: 'Recycler',           threshold: 10,  category: 'recyclable' },
  { id: 'recycler_50',     label: 'Super Recycler',     threshold: 50,  category: 'recyclable' },
  { id: 'eco_warrior',     label: 'Eco Warrior',        threshold: 10,  category: 'organic' },
  { id: 'e_waste_hero',    label: 'E-Waste Hero',       threshold: 5,   category: 'e-waste' },
  { id: 'hazmat_handler',  label: 'Hazmat Handler',     threshold: 5,   category: 'hazardous' },
  { id: 'streak_7',        label: '7-Day Streak',       streakDays: 7 },
  { id: 'streak_30',       label: '30-Day Streak',      streakDays: 30 },
  { id: 'centurion',       label: 'Centurion',          totalPoints: 100 },
  { id: 'legend',          label: 'Legend',             totalPoints: 1000 },
];

export { BADGES };

const userSchema = new mongoose.Schema(
  {
    username:        { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:    { type: String, required: true },
    role:            { type: String, enum: ['citizen', 'moderator', 'administrator'], default: 'citizen' },
    totalPoints:     { type: Number, default: 0 },
    submissionCount: { type: Number, default: 0 },
    // Per-category submission counts for badge tracking
    categoryCounts:  {
      recyclable: { type: Number, default: 0 },
      organic:    { type: Number, default: 0 },
      'e-waste':  { type: Number, default: 0 },
      hazardous:  { type: Number, default: 0 },
    },
    accuracyRate:   { type: Number, default: 0 },   // % of high-confidence submissions
    highConfCount:  { type: Number, default: 0 },   // submissions above threshold
    communityRank:  { type: Number, default: 0 },   // updated on leaderboard refresh
    level:          { type: Number, default: 1 },   // 1-10 based on totalPoints
    streak:         { type: Number, default: 0 },   // current daily streak
    lastSubmitDate: { type: String, default: '' },  // 'YYYY-MM-DD'
    longestStreak:  { type: Number, default: 0 },
    badges:         [{ type: String }],             // array of badge ids earned
    isPrivate:      { type: Boolean, default: false },
    avatar:         { type: String, default: '' },
    bio:            { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

// Level thresholds: level = floor(points/100)+1 capped at 10
userSchema.methods.computeLevel = function () {
  return Math.min(10, Math.floor(this.totalPoints / 100) + 1);
};

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    role: this.role,
    totalPoints: this.totalPoints,
    submissionCount: this.submissionCount,
    categoryCounts: this.categoryCounts,
    accuracyRate: this.accuracyRate,
    communityRank: this.communityRank,
    level: this.level,
    streak: this.streak,
    longestStreak: this.longestStreak,
    badges: this.badges,
    isPrivate: this.isPrivate,
    avatar: this.avatar,
    bio: this.bio,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
