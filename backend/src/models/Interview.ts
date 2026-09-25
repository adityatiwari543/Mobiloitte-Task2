import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterviewDocument extends Document {
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  duration: number; // minutes
  meetingUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true, default: 45 },
    meetingUrl: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String, maxlength: 1000 },
  },
  {
    timestamps: true,
  }
);

InterviewSchema.index({ candidateId: 1, scheduledAt: 1 });
InterviewSchema.index({ recruiterId: 1, scheduledAt: 1 });

export const Interview: Model<IInterviewDocument> =
  mongoose.models.Interview || mongoose.model<IInterviewDocument>('Interview', InterviewSchema);
