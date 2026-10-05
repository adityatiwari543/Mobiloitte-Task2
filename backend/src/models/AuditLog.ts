import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLogDocument extends Document {
  actorUserId?: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

// Immutability Guards (OWASP ASVS V8 & Section 79: Tamper-Resistant Append-Only Logs)
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are strictly append-only and cannot be mutated.'));
  }
  next();
});

AuditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'] as any,
  function (next: any) {
    next(new Error('Audit logs are tamper-proof and cannot be updated.'));
  }
);

AuditLogSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete'] as any,
  function (next: any) {
    next(new Error('Audit logs are tamper-proof and cannot be deleted.'));
  }
);

AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
