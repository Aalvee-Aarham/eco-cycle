import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const rewardSchema = new Schema(
  {
    submission: { type: ObjectId, ref: 'Submission', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true },
    action: { type: String, enum: ['award', 'redeem'], required: true },
    idempotencyKey: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

rewardSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Reward', rewardSchema);
