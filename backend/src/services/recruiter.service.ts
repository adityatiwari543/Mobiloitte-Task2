import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { UpdateRecruiterProfileInput, ERROR_CODES } from '@jobconnect/shared';

export class RecruiterService {
  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Recruiter user not found.',
      };
    }

    let company = await Company.findOne({
      recruiterIds: new mongoose.Types.ObjectId(userId),
    });

    if (!company) {
      const baseSlug = (user.name || 'company')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      company = await Company.create({
        name: `${user.firstName}'s Organization`,
        slug,
        recruiterIds: [user._id],
        isVerified: true,
        isActive: true,
      });
    }

    // Get recruiter stats
    const jobs = await Job.find({ recruiterId: user._id }).select('_id status');
    const jobIds = jobs.map((j) => j._id);
    const totalJobsPosted = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'published').length;
    const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });

    return {
      user,
      company,
      stats: {
        totalJobsPosted,
        activeJobs,
        totalApplications,
      },
    };
  }

  static async updateProfile(userId: string, input: UpdateRecruiterProfileInput) {
    const user = await User.findById(userId);
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Recruiter user not found.',
      };
    }

    // Update user details
    if (input.firstName !== undefined && input.firstName.trim()) {
      user.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined && input.lastName.trim()) {
      user.lastName = input.lastName.trim();
    }
    if (input.firstName !== undefined || input.lastName !== undefined) {
      user.name = `${user.firstName} ${user.lastName}`.trim();
    }
    if (input.dateOfBirth !== undefined) user.dateOfBirth = input.dateOfBirth;
    if (input.gender !== undefined) user.gender = input.gender as any;
    if (input.countryCode !== undefined) user.countryCode = input.countryCode;
    if (input.avatar !== undefined) user.avatar = input.avatar;
    if (input.phone !== undefined && input.phone.trim()) {
      const cleanNumber = input.phone.replace(/\D/g, '');
      user.nationalNumber = cleanNumber;
      const prefix = input.countryCode || user.countryCode || '+91';
      user.phoneE164 = `${prefix}${cleanNumber}`;
    }
    await user.save();

    // Update or create company details
    let company = await Company.findOne({
      recruiterIds: new mongoose.Types.ObjectId(userId),
    });

    if (!company) {
      const baseSlug = (input.companyName || user.name || 'company')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      company = new Company({
        name: input.companyName || `${user.firstName}'s Organization`,
        slug,
        recruiterIds: [user._id],
        isVerified: true,
        isActive: true,
      });
    }

    if (input.companyName !== undefined && input.companyName.trim()) {
      company.name = input.companyName.trim();
    }
    if (input.companyWebsite !== undefined) company.website = input.companyWebsite;
    if (input.companyIndustry !== undefined) company.industry = input.companyIndustry;
    if (input.companyLocation !== undefined) company.location = input.companyLocation;
    if (input.companySize !== undefined) company.companySize = input.companySize;
    if (input.companyDescription !== undefined) company.description = input.companyDescription;
    if (input.companyFoundedYear !== undefined) company.foundedYear = input.companyFoundedYear;

    await company.save();

    const updatedUser = await User.findById(userId).select('-passwordHash');

    return {
      user: updatedUser,
      company,
    };
  }
}
