import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { Application } from '../models/Application.js';
import { AuditLog } from '../models/AuditLog.js';
import { SessionService } from './session.service.js';
import { redisService } from './redis.service.js';
import { ROLES, ACCOUNT_STATUS, ERROR_CODES } from '@jobconnect/shared';

export class AdminService {
  static async getDashboard() {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.CANDIDATE }),
      User.countDocuments({ role: ROLES.RECRUITER }),
      Company.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'published' }),
      Application.countDocuments(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('actorUserId', 'name email role'),
    ]);

    return {
      metrics: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalCompanies,
        totalJobs,
        activeJobs,
        totalApplications,
      },
      recentAuditLogs,
    };
  }

  static async listUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(Math.max(1, options.limit || 20), 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (options.role) query.role = options.role;
    if (options.status) query.status = options.status;
    if (options.search) {
      query.$or = [
        { name: { $regex: options.search.trim(), $options: 'i' } },
        { email: { $regex: options.search.trim(), $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateUserStatus(
    targetUserId: string,
    status: 'active' | 'suspended' | 'deactivated',
    actorAdminId: string
  ) {
    const user = await User.findById(targetUserId);
    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      };
    }

    const prevStatus = user.status;
    user.status = status;
    await user.save();

    // If suspended or deactivated, revoke all their active sessions immediately (Section 4, 6.4)
    if (status === ACCOUNT_STATUS.SUSPENDED || status === ACCOUNT_STATUS.DEACTIVATED) {
      await SessionService.revokeOtherSessions(user._id.toString(), '');
    }

    // Record immutable audit log (Section 7.10, 29)
    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorAdminId),
      action: 'USER_STATUS_UPDATED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { targetEmail: user.email, prevStatus, newStatus: status },
    });

    return user;
  }

  static async listJobs(options: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(Math.max(1, options.limit || 20), 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (options.status) query.status = options.status;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('companyId', 'name logoUrl')
        .populate('recruiterId', 'name email'),
      Job.countDocuments(query),
    ]);

    return {
      items: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async moderateJob(
    jobId: string,
    action: 'pause' | 'publish' | 'resume' | 'close' | 'delete',
    actorAdminId: string
  ) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job not found.',
      };
    }

    const prevStatus = job.status;
    let newStatus: string = job.status;
    if (action === 'delete') {
      await Job.findByIdAndDelete(jobId);
    } else if (action === 'pause') {
      newStatus = 'paused';
      job.status = 'paused';
      await Job.findByIdAndUpdate(jobId, { status: 'paused' });
    } else if (action === 'publish' || action === 'resume') {
      newStatus = 'published';
      job.status = 'published';
      await Job.findByIdAndUpdate(jobId, { status: 'published' });
    } else if (action === 'close') {
      newStatus = 'closed';
      job.status = 'closed';
      await Job.findByIdAndUpdate(jobId, { status: 'closed' });
    }

    // Invalidate caches
    await redisService.del(`jobs:item:${jobId}`);
    await redisService.deletePattern('jobs:list:*');

    // Audit log
    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(actorAdminId),
      action: `ADMIN_JOB_${action.toUpperCase()}`,
      resourceType: 'Job',
      resourceId: jobId,
      metadata: { title: job.title, prevStatus, action, newStatus },
    });

    console.log(`\n📢 [Admin Job Moderation] Job "${job.title}" (${jobId}) status changed: ${prevStatus} -> ${newStatus} (Action: ${action})\n`);

    return {
      message: `Job ${action === 'publish' || action === 'resume' ? 'published' : `${action}d`} successfully.`,
      job: { ...job.toObject(), status: newStatus },
    };
  }

  static async listAuditLogs(page = 1, limit = 20) {
    const clampedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(clampedLimit)
        .populate('actorUserId', 'name email role'),
      AuditLog.countDocuments(),
    ]);

    return {
      items: logs,
      pagination: {
        page,
        limit: clampedLimit,
        total,
        totalPages: Math.ceil(total / clampedLimit),
      },
    };
  }
}
