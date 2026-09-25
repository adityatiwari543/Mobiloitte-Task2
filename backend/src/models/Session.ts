import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISessionDocument extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  userAgentMetadata: {
    browser?: string;
    os?: string;
    device?: string;
    rawUserAgent?: string;
  };
  ipMetadata: {
    ip: string;
  };
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userAgentMetadata: {
      browser: { type: String },
      os: { type: String },
      device: { type: String },
      rawUserAgent: { type: String },
    },
    ipMetadata: {
      ip: { type: String, required: true },
    },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    lastUsedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// TTL index to automatically prune expired sessions from MongoDB
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1 });

export const Session: Model<ISessionDocument> =
  mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);
