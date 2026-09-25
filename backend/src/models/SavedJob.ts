import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedJobDocument extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedJobSchema = new Schema<ISavedJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Compound unique index for saved jobs
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJob: Model<ISavedJobDocument> =
  mongoose.models.SavedJob || mongoose.model<ISavedJobDocument>('SavedJob', SavedJobSchema);
