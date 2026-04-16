import mongoose from 'mongoose';
import { assertValidTransition } from '../utils/stateMachine.js';

const { Schema, Types: { ObjectId } } = mongoose;

const CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];
const STATES = [
  'PENDING', 'CLASSIFIED', 'IN_DISPUTE', 'RESOLVED_AUTO',
  'RESOLVED_MANUAL', 'AWAITING_REWARD', 'REWARDED', 'FLAGGED', 'REDEEMED'
];
const CONFIDENCE_TIERS = ['high', 'medium', 'low'];

const submissionSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    imageUrl: String,
    pHash: String,
    category: { type: String, enum: CATEGORIES },
    subcategory: String,
    confidence: Number,
    confidenceTier: { type: String, enum: CONFIDENCE_TIERS },
    disputeResult: { category: String, confidence: Number, classifier: String },
    state: { type: String, enum: STATES, default: 'PENDING' },
    points: { type: Number, default: 0 },
    idempotencyKey: { type: String, unique: true, sparse: true },
    flagReason: String,
    resolvedBy: { type: ObjectId, ref: 'User' },
    classifier: String,
    reasoning: String,
    detectedImageUrl: String,
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ state: 1 });
submissionSchema.index({ pHash: 1 });
submissionSchema.index({ confidenceTier: 1 });

submissionSchema.pre('save', function (next) {
  if (this.isModified('state') && !this.isNew) {
    // Note: transition() method handles this check explicitly.
  }
  next();
});

// Capture original state on load
submissionSchema.post('init', function (doc) {
  doc._originalState = doc.state;
});

// Update original state on save to support multiple chained transitions on the same instance
submissionSchema.post('save', function (doc) {
  doc._originalState = doc.state;
});

// Update original state on save to support multiple chained transitions on the same instance
submissionSchema.post('save', function (doc) {
  doc._originalState = doc.state;
});

submissionSchema.pre('save', function (next) {
  if (this.isModified('state') && !this.isNew && this._originalState) {
    try {
      assertValidTransition(this._originalState, this.state);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

submissionSchema.methods.transition = async function (newState) {
  this.state = newState;
  await this.save();
  return this;
};

export default mongoose.model('Submission', submissionSchema);
