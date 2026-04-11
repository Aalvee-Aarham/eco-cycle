import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const systemConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('SystemConfig', systemConfigSchema);
