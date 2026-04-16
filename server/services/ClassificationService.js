import { AdapterFactory } from '../classifiers/AdapterFactory.js';
import { getConfig, getSecondaryClassifier, LOW_CONF_LIMIT } from '../config/system.config.js';
import { FraudService } from './FraudService.js';
import { AuditService } from './AuditService.js';
import { RewardService } from './RewardService.js';
import { DisputeService } from './DisputeService.js';
import { computePHash } from '../utils/phash.js';
import { UploadService } from './UploadService.js';
import Submission from '../models/Submission.js';

/**
 * Derives the confidence tier label from a raw score.
 * @param {number} confidence
 * @param {number} highThreshold  admin-configured high threshold (default 0.73)
 * @returns {'high'|'medium'|'low'}
 */
function getTier(confidence, highThreshold) {
  if (confidence >= highThreshold) return 'high';
  if (confidence >= LOW_CONF_LIMIT) return 'medium';
  return 'low';
}

export const ClassificationService = {
  async classify(userId, imageBuffer, mimeType, classifierOverride, idempotencyKey) {
    const config = getConfig();

    // 1. Fraud check (pHash against Redis window) — before creating submission
    const pHash = await computePHash(imageBuffer);
    const isFraud = await FraudService.check(userId, pHash);

    // 2. Upload to Cloudinary & Create submission in PENDING state
    let imageUrl = '';
    try {
      imageUrl = await UploadService.uploadImage(imageBuffer);
    } catch (err) {
      console.error('Cloudinary upload failed:', err.message);
    }

    const sub = await Submission.create({
      user: userId,
      pHash,
      imageUrl,
      state: 'PENDING',
      idempotencyKey,
    });

    await AuditService.write(
      'SUBMISSION_CREATED',
      { submissionId: sub._id, pHash: pHash.slice(0, 8) + '...', classifier: classifierOverride || config.PRIMARY_CLASSIFIER },
      userId,
      sub._id,
      'Submission'
    );

    // 3. Fraud path — flag immediately, no points
    if (isFraud) {
      sub.flagReason = 'DUPLICATE_IMAGE';
      await sub.transition('FLAGGED');
      await AuditService.write(
        'FRAUD_FLAGGED',
        { submissionId: sub._id, reason: 'DUPLICATE_IMAGE', pHash },
        userId,
        sub._id,
        'Submission'
      );
      return { submission: sub, flagged: true };
    }

    // 4. Classify with primary adapter
    const primaryName = classifierOverride || config.PRIMARY_CLASSIFIER;
    let result;
    try {
      const adapter = AdapterFactory.get(primaryName);
      result = await adapter.classify(imageBuffer, mimeType);
    } catch (err) {
      // Primary failed — re-throw (no mock fallback)
      console.error(`Primary classifier ${primaryName} failed:`, err.message);
      await AuditService.write('CLASSIFIER_FAILED', { classifier: primaryName, error: err.message }, userId, sub._id, 'Submission');
      throw err;
    }

    sub.category = result.category;
    sub.subcategory = result.subcategory;
    sub.confidence = result.confidence;
    sub.classifier = primaryName;
    sub.reasoning = result.rawResponse?.reasoning || '';
    sub.confidenceTier = getTier(result.confidence, config.HIGH_CONF_THRESHOLD);

    // If YOLO returned a base64 annotated image, upload to Cloudinary
    if (result.rawResponse?.detected_image) {
      try {
        const dUrl = await UploadService.uploadBase64(result.rawResponse.detected_image);
        if (dUrl) sub.detectedImageUrl = dUrl;
      } catch (err) {
        console.error('Cloudinary detected-image upload failed:', err.message);
      }
    }

    await sub.save();

    await AuditService.write(
      'CLASSIFICATION_DECISION',
      {
        submissionId: sub._id,
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
        confidenceTier: sub.confidenceTier,
        classifier: primaryName,
        reasoning: result.rawResponse?.reasoning,
      },
      userId,
      sub._id,
      'Submission'
    );

    // 5. Route by confidence tier
    if (sub.confidenceTier === 'high') {
      // ── HIGH: direct to reward ────────────────────────────────────────────
      await sub.transition('CLASSIFIED');
      await AuditService.write('STATE_TRANSITION', { from: 'PENDING', to: 'CLASSIFIED', submissionId: sub._id }, userId, sub._id, 'Submission');

      await sub.transition('AWAITING_REWARD');
      await AuditService.write('STATE_TRANSITION', { from: 'CLASSIFIED', to: 'AWAITING_REWARD', submissionId: sub._id }, userId, sub._id, 'Submission');

      await RewardService.award(sub);

    } else {
      // ── MEDIUM or LOW: run secondary model to attempt auto-resolution ──
      // Transition to IN_DISPUTE as the initial state
      await sub.transition('IN_DISPUTE');
      await AuditService.write(
        'STATE_TRANSITION',
        { from: 'PENDING', to: 'IN_DISPUTE', reason: `${sub.confidenceTier.toUpperCase()}_CONFIDENCE`, confidence: result.confidence, submissionId: sub._id },
        userId,
        sub._id,
        'Submission'
      );

      // If secondary classifier is enabled, run it
      if (!config.DISABLE_SECONDARY_CLASSIFIER) {
        const secondaryName = getSecondaryClassifier(primaryName);
        await DisputeService.resolve(sub, imageBuffer, mimeType, secondaryName, config);
      } else {
        console.log('[ClassificationService] Secondary classifier disabled, skipping resolution attempt');
      }
    }

    return {
      submission: sub,
      flagged: false,
      raw: result.rawResponse,
    };
  },
};
