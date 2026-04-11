import { AdapterFactory } from '../classifiers/AdapterFactory.js';
import { getConfig } from '../config/system.config.js';
import { AuditService } from './AuditService.js';
import { RewardService } from './RewardService.js';

export const DisputeService = {
  async resolve(submission, imageBuffer, mimeType) {
    const config = getConfig();
    const secondaryName = config.SECONDARY_CLASSIFIER;

    try {
      const adapter = AdapterFactory.get(secondaryName);
      // If no buffer (e.g., after storage), use mock result
      let result;
      if (imageBuffer) {
        result = await adapter.classify(imageBuffer, mimeType);
      } else {
        result = {
          category: submission.category,
          confidence: 0.80,
          subcategory: submission.subcategory,
          rawResponse: { auto: true },
        };
      }

      submission.disputeResult = {
        category: result.category,
        confidence: result.confidence,
      };

      // Only auto-resolve if secondary classifier is SURE
      if (result.confidence >= config.CONFIDENCE_THRESHOLD) {
        submission.category = result.category;
        submission.subcategory = result.subcategory;

        await submission.transition('RESOLVED_AUTO');
        await AuditService.write('DISPUTE_RESOLVED_AUTO', {
          submissionId: submission._id,
          secondaryResult: result,
        });

        await submission.transition('AWAITING_REWARD');
        await RewardService.award(submission);
      } else {
        // Still uncertain — leave in IN_DISPUTE for Moderator
        await AuditService.write('DISPUTE_AUTO_FAILED_LOW_CONFIDENCE', {
          submissionId: submission._id,
          secondaryResult: result,
        });
        await submission.save();
      }

      return submission;
    } catch (err) {
      await AuditService.write('DISPUTE_RESOLUTION_FAILED', {
        submissionId: submission._id,
        error: err.message,
      });
      throw err;
    }
  },

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
