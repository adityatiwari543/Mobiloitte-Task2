import mongoose, { Schema, Document, Model } from 'mongoose';
import { REMOTE_TYPES, EMPLOYMENT_TYPES, JOB_STATUS } from '@jobconnect/shared';

export interface IJobDocument extends Document {
  title: string;
  slug: string;
  description: string;
  companyId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  skills: string[];
  location: string;
  remoteType: 'onsite' | 'remote' | 'hybrid';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceMin: number;
  experienceMax: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: 'draft' | 'published' | 'paused' | 'closed' | 'expired';
  applicationDeadline: Date;
  viewsCount: number;
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJobDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skills: [{ type: String, trim: true, lowercase: true }],
    location: { type: String, required: true, trim: true },
    remoteType: {
      type: String,
      enum: Object.values(REMOTE_TYPES),
      required: true,
    },
    employmentType: {
      type: String,
      enum: Object.values(EMPLOYMENT_TYPES),
      required: true,
    },
    experienceMin: { type: Number, required: true, min: 0 },
    experienceMax: { type: Number, required: true, min: 0 },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.PUBLISHED,
      index: true,
    },
    applicationDeadline: { type: Date, required: true },
    viewsCount: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound indexes as planned in architecture and Section 8
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, status: 1 });
JobSchema.index({ recruiterId: 1, status: 1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ location: 1, remoteType: 1 });
JobSchema.index({ title: 'text', description: 'text' });

export const Job: Model<IJobDocument> =
  mongoose.models.Job || mongoose.model<IJobDocument>('Job', JobSchema);
