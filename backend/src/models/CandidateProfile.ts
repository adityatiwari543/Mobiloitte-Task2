import mongoose, { Schema, Document, Model } from 'mongoose';
import { EMPLOYMENT_TYPES } from '@jobconnect/shared';

export interface ICandidateProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  education: Array<{
    _id?: mongoose.Types.ObjectId;
    degree: string;
    institution: string;
    fieldOfStudy: string;
    startYear: number;
    endYear?: number;
    grade?: string;
  }>;
  experience: Array<{
    _id?: mongoose.Types.ObjectId;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }>;
  resumeUrl?: string;
  resumeOriginalName?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  preferredJobTypes: string[];
  preferredLocations: string[];
  expectedSalary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  noticePeriod?: string;
  createdAt: Date;
  updatedAt: Date;
  calculateCompleteness(): number;
}

const CandidateProfileSchema = new Schema<ICandidateProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, trim: true, maxlength: 3000 },
    location: { type: String, trim: true, maxlength: 100 },
    skills: [{ type: String, trim: true, lowercase: true }],
    education: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        startYear: { type: Number, required: true },
        endYear: { type: Number },
        grade: { type: String },
      },
    ],
    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        startDate: { type: String, required: true },
        endDate: { type: String },
        isCurrent: { type: Boolean, default: false },
        description: { type: String },
      },
    ],
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    portfolioUrl: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },
    preferredJobTypes: [
      {
        type: String,
        enum: Object.values(EMPLOYMENT_TYPES),
      },
    ],
    preferredLocations: [{ type: String }],
    expectedSalary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    noticePeriod: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index on skills for candidate-job matching query efficiency
CandidateProfileSchema.index({ skills: 1 });

// Method to deterministically calculate completeness (Section 25)
CandidateProfileSchema.methods.calculateCompleteness = function (): number {
  let score = 0;
  if (this.headline) score += 15;
  if (this.bio) score += 15;
  if (this.location) score += 10;
  if (this.skills && this.skills.length > 0) score += 20;
  if (this.resumeUrl) score += 20;
  if (this.experience && this.experience.length > 0) score += 10;
  if (this.education && this.education.length > 0) score += 10;
  return Math.min(score, 100);
};

export const CandidateProfile: Model<ICandidateProfileDocument> =
  mongoose.models.CandidateProfile ||
  mongoose.model<ICandidateProfileDocument>('CandidateProfile', CandidateProfileSchema);
