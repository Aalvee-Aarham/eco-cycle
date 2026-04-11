import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const followSchema = new Schema(
  {
    follower: { type: ObjectId, ref: 'User', required: true },
    followee: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1 });
followSchema.index({ followee: 1 });
followSchema.index({ follower: 1, followee: 1 }, { unique: true });

export default mongoose.model('Follow', followSchema);
