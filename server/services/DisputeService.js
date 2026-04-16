import { AdapterFactory } from '../classifiers/AdapterFactory.js';
import { AuditService } from './AuditService.js';
import { RewardService } from './RewardService.js';
import { UploadService } from './UploadService.js';

export const DisputeService = {
  /**
   * Called only for LOW-confidence primary results.
   * Runs the secondary model; if secondary is HIGH → RESOLVED_AUTO + reward;
   * if secondary is also LOW → FLAGGED (double-low auto-reject).
   */
  async resolve(submission, imageBuffer, mimeType, secondaryName, config) {
    const highThreshold = config?.HIGH_CONF_THRESHOLD ?? 0.73;

    try {
      const adapter = AdapterFactory.get(secondaryName);
      const result = await adapter.classify(imageBuffer, mimeType);

      // Store secondary result info on the submission
      submission.disputeResult = {
        category: result.category,
        confidence: result.confidence,
        classifier: secondaryName,
      };

      // Upload secondary detected image if YOLO was secondary
      if (result.rawResponse?.detected_image) {
        try {
          const dUrl = await UploadService.uploadBase64(result.rawResponse.detected_image);
          if (dUrl) submission.detectedImageUrl = dUrl;
        } catch {}
      }

      // Carry over reasoning if Gemini was secondary
      if (result.rawResponse?.reasoning && !submission.reasoning) {
        submission.reasoning = result.rawResponse.reasoning;
      }

      await AuditService.write('DISPUTE_SECONDARY_RESULT', {
        submissionId: submission._id,
        secondaryClassifier: secondaryName,
        category: result.category,
        confidence: result.confidence,
      });

      // We need to calculate the secondary tier using the same logic as the primary tier.
      // We know config.HIGH_CONF_THRESHOLD and LOW_CONF_LIMIT (hardcoded 0.20 in system.config)
      const secConfidence = result.confidence;
      let sTier = 'low';
      if (secConfidence >= highThreshold) sTier = 'high';
      else if (secConfidence >= 0.20) sTier = 'medium';

      if (sTier === 'high') {
        // ── Secondary HIGH: override category + auto-resolve with reward ───
        submission.category = result.category;
        submission.subcategory = result.subcategory ?? submission.subcategory;
        submission.confidenceTier = 'high'; // ACT AS HIGH CONFIDENCE ON UI!

        await submission.transition('RESOLVED_AUTO');
        await AuditService.write('DISPUTE_RESOLVED_AUTO', {
          submissionId: submission._id,
          secondaryClassifier: secondaryName,
          secondaryResult: { category: result.category, confidence: result.confidence },
        });

        await submission.transition('AWAITING_REWARD');
        await RewardService.award(submission);
      } else if (submission.confidenceTier === 'low' && sTier === 'low') {
        // ── Secondary also LOW: flag — both models uncertain ────────────────
        submission.flagReason = 'LOW_CONFIDENCE_BOTH_MODELS';
        await submission.transition('FLAGGED');
        await AuditService.write('DISPUTE_FLAGGED_DOUBLE_LOW', {
          submissionId: submission._id,
          secondaryClassifier: secondaryName,
          secondaryConfidence: result.confidence,
          primaryConfidence: submission.confidence,
        });
      } else {
        // ── Any combination of medium/low mixed (e.g. both medium) — Leave in dispute ──
        await submission.save();
      }

      return submission;
    } catch (err) {
      if (submission) {
        await AuditService.write('DISPUTE_RESOLUTION_FAILED', {
          submissionId: submission._id,
          secondaryClassifier: secondaryName,
          error: err.message,
        });
        // Flag on error so it appears in moderator queue
        submission.flagReason = 'SECONDARY_CLASSIFIER_ERROR';
        try {
          await submission.transition('FLAGGED');
        } catch {}
      }
      throw err;
    }
  },

  /**
   * Manual resolution by a moderator.
   * Works for both IN_DISPUTE (medium confidence) and FLAGGED submissions.
   */
  async resolveManual(submission, moderatorId, category, outcome) {
    submission.category = category;
    submission.resolvedBy = moderatorId;

    await submission.transition('RESOLVED_MANUAL');
    await AuditService.write('DISPUTE_RESOLVED_MANUAL', {
      submissionId: submission._id,
      category,
      outcome,
    }, moderatorId);

    await submission.transition('AWAITING_REWARD');
    await RewardService.award(submission);

    return submission;
  },
};
