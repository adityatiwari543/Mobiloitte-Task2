import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ACCOUNT_STATUS, GENDER_OPTIONS } from '@jobconnect/shared';
import { HIGHEST_QUALIFICATIONS } from '@jobconnect/shared';

export interface IUserDocument extends Document {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  countryCode: string;
  nationalNumber: string;
  passwordHash: string;
  role: 'candidate' | 'recruiter' | 'admin';
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  highestQualification?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  status: 'active' | 'pending_verification' | 'suspended' | 'deactivated';
  lastLoginAt?: Date;
  termsAcceptedAt: Date;
  privacyAcceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneE164: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    countryCode: { type: String, required: true, default: '+91' },
    nationalNumber: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CANDIDATE,
      index: true,
    },
    avatar: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String, enum: GENDER_OPTIONS },
    highestQualification: { type: String, enum: HIGHEST_QUALIFICATIONS },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.PENDING_VERIFICATION,
      index: true,
    },
    lastLoginAt: { type: Date },
    termsAcceptedAt: { type: Date, default: Date.now },
    privacyAcceptedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for role-based administrative filtering
UserSchema.index({ role: 1, status: 1 });

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
