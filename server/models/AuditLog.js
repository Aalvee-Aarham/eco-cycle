import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const auditLogSchema = new Schema(
  {
    event: { type: String, required: true },
    actor: { type: ObjectId, ref: 'User' },
    target: { type: ObjectId },
    targetModel: String,
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    // Immutable - no updates allowed
  }
);

auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1 });

// Prevent updates
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog is immutable');
});

export default mongoose.model('AuditLog', auditLogSchema);
