import mongoose from 'mongoose';
import { assertValidTransition } from '../utils/stateMachine.js';

const { Schema, Types: { ObjectId } } = mongoose;

const CATEGORIES = ['recyclable', 'organic', 'e-waste', 'hazardous'];
const STATES = [
  'PENDING', 'CLASSIFIED', 'IN_DISPUTE', 'RESOLVED_AUTO',
  'RESOLVED_MANUAL', 'AWAITING_REWARD', 'REWARDED', 'FLAGGED', 'REDEEMED'
];

const submissionSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    imageUrl: String,
    pHash: String,
    category: { type: String, enum: CATEGORIES },
    subcategory: String,
    confidence: Number,
    disputeResult: { category: String, confidence: Number },
    state: { type: String, enum: STATES, default: 'PENDING' },
    points: { type: Number, default: 0 },
    idempotencyKey: { type: String, unique: true, sparse: true },
    flagReason: String,
    resolvedBy: { type: ObjectId, ref: 'User' },
    classifier: String,
    reasoning: String,
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ state: 1 });
submissionSchema.index({ pHash: 1 });

submissionSchema.methods.transition = async function (newState) {
  assertValidTransition(this.state, newState);
  this.state = newState;
  await this.save();
  return this;
};

export default mongoose.model('Submission', submissionSchema);
