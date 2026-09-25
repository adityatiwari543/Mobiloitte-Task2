import mongoose from 'mongoose';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { SavedJob } from '../models/SavedJob.js';
import { Interview } from '../models/Interview.js';
import { Job } from '../models/Job.js';
import { UpdateProfileInput, ERROR_CODES } from '@jobconnect/shared';

export class CandidateService {
  static async getProfile(userId: string) {
    let profile = await CandidateProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!profile) {
      profile = await CandidateProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        skills: [],
        education: [],
        experience: [],
        preferredJobTypes: [],
        preferredLocations: [],
      });
    }

    const user = await User.findById(userId).select('-passwordHash');
    const completeness = profile.calculateCompleteness();
    return {
      user,
      profile,
      profileCompletionPercentage: completeness,
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    let profile = await CandidateProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!profile) {
      profile = new CandidateProfile({
        userId: new mongoose.Types.ObjectId(userId),
      });
    }

    if (input.headline !== undefined) profile.headline = input.headline;
    if (input.bio !== undefined) profile.bio = input.bio;
    if (input.location !== undefined) profile.location = input.location;
    if (input.skills !== undefined) profile.skills = input.skills.map((s) => s.toLowerCase().trim());
    if (input.education !== undefined) profile.education = input.education as any;
    if (input.experience !== undefined) profile.experience = input.experience as any;
    if (input.portfolioUrl !== undefined) profile.portfolioUrl = input.portfolioUrl;
    if (input.githubUrl !== undefined) profile.githubUrl = input.githubUrl;
    if (input.linkedinUrl !== undefined) profile.linkedinUrl = input.linkedinUrl;
    if (input.preferredJobTypes !== undefined) profile.preferredJobTypes = input.preferredJobTypes;
    if (input.preferredLocations !== undefined) profile.preferredLocations = input.preferredLocations;
    if (input.expectedSalary !== undefined) profile.expectedSalary = input.expectedSalary;
    if (input.noticePeriod !== undefined) profile.noticePeriod = input.noticePeriod;

    await profile.save();

    // Update User document personal fields
    const user = await User.findById(userId);
    if (user) {
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
      if (input.highestQualification !== undefined) user.highestQualification = input.highestQualification;
      if (input.countryCode !== undefined) user.countryCode = input.countryCode;
      if (input.avatar !== undefined) user.avatar = input.avatar;
      if (input.phone !== undefined && input.phone.trim()) {
        const cleanNumber = input.phone.replace(/\D/g, '');
        user.nationalNumber = cleanNumber;
        const prefix = input.countryCode || user.countryCode || '+91';
        user.phoneE164 = `${prefix}${cleanNumber}`;
      }
      await user.save();
    }

    const completeness = profile.calculateCompleteness();
    const updatedUser = await User.findById(userId).select('-passwordHash');

    return {
      user: updatedUser,
      profile,
      profileCompletionPercentage: completeness,
    };
  }

  static async uploadResume(userId: string, file: Express.Multer.File) {
    const profile = await CandidateProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!profile) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Candidate profile not found.',
      };
    }

    // Relative URL for serving
    const resumeUrl = `/uploads/${file.filename}`;
    profile.resumeUrl = resumeUrl;
    profile.resumeOriginalName = file.originalname;
    await profile.save();

    return {
      resumeUrl,
      originalName: file.originalname,
      profileCompletionPercentage: profile.calculateCompleteness(),
    };
  }

  static async removeResume(userId: string) {
    const profile = await CandidateProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (profile) {
      profile.resumeUrl = undefined;
      profile.resumeOriginalName = undefined;
      await profile.save();
    }

    return { message: 'Resume removed successfully.' };
  }

  static async getDashboard(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [profile, applicationsCount, savedJobsCount, upcomingInterviews, recentApplications] =
      await Promise.all([
        CandidateProfile.findOne({ userId: userObjectId }),
        Application.countDocuments({ candidateId: userObjectId }),
        SavedJob.countDocuments({ userId: userObjectId }),
        Interview.find({
          candidateId: userObjectId,
          scheduledAt: { $gte: new Date() },
          status: 'scheduled',
        })
          .sort({ scheduledAt: 1 })
          .limit(3)
          .populate('recruiterId', 'name email'),
        Application.find({ candidateId: userObjectId })
          .sort({ appliedAt: -1 })
          .limit(5)
          .populate('jobId', 'title location remoteType companyId status')
          .populate({
            path: 'jobId',
            populate: { path: 'companyId', select: 'name logoUrl' },
          }),
      ]);

    // Deterministic recommended jobs based on candidate skills (Section 26)
    const candidateSkills = profile?.skills || [];
    let recommendedJobs: unknown[] = [];
    if (candidateSkills.length > 0) {
      recommendedJobs = await Job.find({
        status: 'published',
        skills: { $in: candidateSkills },
        applicationDeadline: { $gte: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('companyId', 'name logoUrl location');
    } else {
      recommendedJobs = await Job.find({
        status: 'published',
        applicationDeadline: { $gte: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('companyId', 'name logoUrl location');
    }

    const completeness = profile ? profile.calculateCompleteness() : 0;

    return {
      profileCompletionPercentage: completeness,
      metrics: {
        totalApplications: applicationsCount,
        savedJobsCount,
        upcomingInterviewsCount: upcomingInterviews.length,
      },
      upcomingInterviews,
      recentApplications,
      recommendedJobs,
    };
  }
}
