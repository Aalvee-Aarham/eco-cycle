export const CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];

export const CATEGORY_META = {
  recyclable: { label: 'Recyclable', color: 'bg-green-100 text-green-800', icon: '♻️' },
  organic: { label: 'Organic', color: 'bg-amber-100 text-amber-800', icon: '🍃' },
  'e-waste': { label: 'E-Waste', color: 'bg-indigo-100 text-indigo-800', icon: '💾' },
  hazardous: { label: 'Hazardous', color: 'bg-red-100 text-red-800', icon: '⚠️' },
};

export const STATE_META = {
  PENDING: { label: 'Pending', color: 'bg-slate-100 text-slate-600' },
  CLASSIFIED: { label: 'Classified', color: 'bg-blue-100 text-blue-700' },
  IN_DISPUTE: { label: 'In Dispute', color: 'bg-orange-100 text-orange-700' },
  RESOLVED_AUTO: { label: 'Resolved (Auto)', color: 'bg-teal-100 text-teal-700' },
  RESOLVED_MANUAL: { label: 'Resolved (Mod)', color: 'bg-purple-100 text-purple-700' },
  AWAITING_REWARD: { label: 'Awaiting Reward', color: 'bg-yellow-100 text-yellow-700' },
  REWARDED: { label: 'Rewarded', color: 'bg-green-100 text-green-700' },
  REDEEMED: { label: 'Redeemed', color: 'bg-green-200 text-green-900' },
  FLAGGED: { label: 'Flagged', color: 'bg-red-100 text-red-700' },
};

export const BADGE_META = {
  first_recycle: { label: 'First Recycle', icon: '🌱' },
  recycler_10: { label: 'Recycler', icon: '♻️' },
  recycler_50: { label: 'Super Recycler', icon: '🔄' },
  eco_warrior: { label: 'Eco Warrior', icon: '🌿' },
  e_waste_hero: { label: 'E-Waste Hero', icon: '💾' },
  hazmat_handler: { label: 'Hazmat Handler', icon: '🧪' },
  streak_7: { label: '7-Day Streak', icon: '🔥' },
  streak_30: { label: '30-Day Streak', icon: '🔥' },
  centurion: { label: 'Centurion', icon: '🏅' },
  legend: { label: 'Legend', icon: '👑' },
};

export const ROLES = ['citizen', 'moderator', 'administrator'];
