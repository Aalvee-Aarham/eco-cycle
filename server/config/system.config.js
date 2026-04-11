import SystemConfig from '../models/SystemConfig.js';

export const DEFAULT_CONFIG = {
  CONFIDENCE_THRESHOLD: 0.72,
  FRAUD_WINDOW_MINUTES: 60,
  PHASH_HAMMING_THRESHOLD: 10,
  LEADERBOARD_TTL_SECONDS: 55,
  IDEMPOTENCY_TTL_SECONDS: 86400,
  PRIMARY_CLASSIFIER: process.env.CLASSIFIER || 'gemini',
  SECONDARY_CLASSIFIER: 'mock',
  POINTS_PER_SUBMISSION: {
    recyclable: 10,
    organic: 8,
    'e-waste': 15,
    hazardous: 12,
  },
};

let _config = { ...DEFAULT_CONFIG };

export async function loadConfig() {
  try {
    const docs = await SystemConfig.find();
    docs.forEach((doc) => {
      _config[doc.key] = doc.value;
    });
  } catch {
    // DB not available, use defaults
  }
  // Override from env
  if (process.env.CONFIDENCE_THRESHOLD) _config.CONFIDENCE_THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD);
  if (process.env.FRAUD_WINDOW_MINUTES) _config.FRAUD_WINDOW_MINUTES = Number(process.env.FRAUD_WINDOW_MINUTES);
  return _config;
}

export function getConfig() {
  return _config;
}

export async function setConfigValue(key, value, adminId) {
  _config[key] = value;
  await SystemConfig.findOneAndUpdate(
    { key },
    { key, value, updatedBy: adminId, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return _config;
}
