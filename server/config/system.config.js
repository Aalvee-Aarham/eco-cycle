import SystemConfig from '../models/SystemConfig.js';

// The minimum confidence below which we treat a result as "low" and run the secondary model.
// This is intentionally hardcoded — only HIGH_CONF_THRESHOLD is admin-adjustable.
export const LOW_CONF_LIMIT = 0.20;

export const DEFAULT_CONFIG = {
  HIGH_CONF_THRESHOLD: 0.73,    // confidence >= this → high, award points directly
  FRAUD_WINDOW_MINUTES: 60,
  PHASH_HAMMING_THRESHOLD: 10,
  LEADERBOARD_TTL_SECONDS: 55,
  IDEMPOTENCY_TTL_SECONDS: 86400,
  // Primary classifier: 'yolo' | 'gemini'
  // Secondary is always the opposite of primary.
  PRIMARY_CLASSIFIER: process.env.CLASSIFIER || 'yolo',
  DISABLE_FRAUD_CHECK: false,   // if true, duplicate checking is disabled
  DISABLE_SECONDARY_CLASSIFIER: false,  // if true, secondary classifier is not run for low confidence
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
  if (process.env.HIGH_CONF_THRESHOLD) _config.HIGH_CONF_THRESHOLD = Number(process.env.HIGH_CONF_THRESHOLD);
  // Legacy env support
  if (process.env.CONFIDENCE_THRESHOLD) _config.HIGH_CONF_THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD);
  if (process.env.FRAUD_WINDOW_MINUTES) _config.FRAUD_WINDOW_MINUTES = Number(process.env.FRAUD_WINDOW_MINUTES);
  if (process.env.CLASSIFIER) _config.PRIMARY_CLASSIFIER = process.env.CLASSIFIER;
  return _config;
}

export function getConfig() {
  return _config;
}

/** Derives the secondary classifier name from the primary. */
export function getSecondaryClassifier(primaryName) {
  return primaryName === 'yolo' ? 'gemini' : 'yolo';
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
