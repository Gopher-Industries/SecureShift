import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object },
  },
  { versionKey: false }
);

AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);
