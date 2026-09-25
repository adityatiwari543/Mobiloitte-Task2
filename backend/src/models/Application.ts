import mongoose, { Schema, Document, Model } from 'mongoose';
import { APPLICATION_STATUS } from '@jobconnect/shared';

export interface IApplicationDocument extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeUrl: string;
  coverLetter?: string;
  status:
    | 'applied'
    | 'under_review'
    | 'shortlisted'
    | 'interview'
    | 'selected'
    | 'rejected'
    | 'withdrawn';
  recruiterNotes: Array<{
    authorId: mongoose.Types.ObjectId;
    note: string;
    createdAt: Date;
  }>;
  appliedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    candidateId: {
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
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String, maxlength: 4000 },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
      index: true,
    },
    recruiterNotes: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    appliedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// CRITICAL Section 7.5 & 45: Unique compound index preventing duplicate applications at the database level
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

// Query indexes for recruiter pipeline & candidate tracking
ApplicationSchema.index({ jobId: 1, status: 1, appliedAt: -1 });
ApplicationSchema.index({ candidateId: 1, appliedAt: -1 });

export const Application: Model<IApplicationDocument> =
  mongoose.models.Application ||
  mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
