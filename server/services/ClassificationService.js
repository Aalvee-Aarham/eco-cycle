import { AdapterFactory } from '../classifiers/AdapterFactory.js';
import { getConfig } from '../config/system.config.js';
import { FraudService } from './FraudService.js';
import { AuditService } from './AuditService.js';
import { RewardService } from './RewardService.js';
import { DisputeService } from './DisputeService.js';
import { computePHash } from '../utils/phash.js';
import { UploadService } from './UploadService.js';
import Submission from '../models/Submission.js';

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
      // Fallback: we could still proceed without an image, but let's log it
    }

    const sub = await Submission.create({
      user: userId,
      pHash,
      imageUrl,
      state: 'PENDING',
      idempotencyKey,
    });

    // Spec: every event must be audit logged as part of the same operation
    await AuditService.write(
      'SUBMISSION_CREATED',
      { submissionId: sub._id, pHash: pHash.slice(0, 8) + '...', classifier: classifierOverride || config.PRIMARY_CLASSIFIER },
      userId,
      sub._id,
      'Submission'
    );

    // 3. Fraud path — flag and audit, no points
    if (isFraud) {
      sub.flagReason = 'DUPLICATE_IMAGE';
      await sub.transition('FLAGGED');
      // Spec: flagged submissions recorded in audit trail
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
    const adapterName = classifierOverride || config.PRIMARY_CLASSIFIER;
    let result;
    try {
      const adapter = AdapterFactory.get(adapterName);
      result = await adapter.classify(imageBuffer, mimeType);
    } catch (err) {
      // Fallback to mock on primary failure — still audit it
      console.error(`Primary classifier ${adapterName} failed:`, err.message);
      const mock = AdapterFactory.get('mock');
      result = await mock.classify(imageBuffer, mimeType);
      result.rawResponse = { ...result.rawResponse, fallback: true, originalError: err.message };
      await AuditService.write('CLASSIFIER_FALLBACK', { adapterName, error: err.message }, userId, sub._id, 'Submission');
    }

    sub.category = result.category;
    sub.subcategory = result.subcategory;
    sub.confidence = result.confidence;
    sub.classifier = adapterName;
    sub.reasoning = result.rawResponse?.reasoning || '';
    await sub.save();

    // Spec: classification decisions must be audit logged
    await AuditService.write(
      'CLASSIFICATION_DECISION',
      {
        submissionId: sub._id,
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
        classifier: adapterName,
        reasoning: result.rawResponse?.reasoning,
      },
      userId,
      sub._id,
      'Submission'
    );

    // 5. Route by confidence threshold
    if (result.confidence >= config.CONFIDENCE_THRESHOLD) {
      // High-confidence path — direct to reward
      await sub.transition('CLASSIFIED');
      await AuditService.write('STATE_TRANSITION', { from: 'PENDING', to: 'CLASSIFIED', submissionId: sub._id }, userId, sub._id, 'Submission');

      await sub.transition('AWAITING_REWARD');
      await AuditService.write('STATE_TRANSITION', { from: 'CLASSIFIED', to: 'AWAITING_REWARD', submissionId: sub._id }, userId, sub._id, 'Submission');

      // RewardService internally transitions to REWARDED and writes REWARD_AWARDED audit
      await RewardService.award(sub);
    } else {
      // Low-confidence path — dispute resolution
      await sub.transition('IN_DISPUTE');
      await AuditService.write('STATE_TRANSITION', { from: 'PENDING', to: 'IN_DISPUTE', submissionId: sub._id, confidence: result.confidence }, userId, sub._id, 'Submission');

      // Spec: dispute resolution < 1 second from initial low-confidence result
      // DisputeService runs secondary classifier and records outcome
      await DisputeService.resolve(sub, imageBuffer, mimeType);
    }

    return { submission: sub, flagged: false };
  },
};
