import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyDocument extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  foundedYear?: number;
  recruiterIds: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompanyDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: { type: String },
    description: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String },
    location: { type: String, trim: true },
    foundedYear: { type: Number },
    recruiterIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ recruiterIds: 1 });

export const Company: Model<ICompanyDocument> =
  mongoose.models.Company || mongoose.model<ICompanyDocument>('Company', CompanySchema);
