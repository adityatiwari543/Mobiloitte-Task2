import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Interview } from '../models/Interview.js';
import { AuditLog } from '../models/AuditLog.js';
import { redisService } from './redis.service.js';
import {
  ApplyJobInput,
  UpdateApplicationStatusInput,
  ScheduleInterviewInput,
  ApplicationStatus,
  APPLICATION_STATUS,
  ERROR_CODES,
  ROLES,
} from '@jobconnect/shared';

/**
 * Strict State Machine Transition Rules (OWASP ASVS V11 - Business Logic Verification)
 * Enforces valid hiring pipeline workflow transitions and prevents unauthorized jumps or resurrection of terminal states.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.UNDER_REVIEW]: [
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.SHORTLISTED]: [
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.INTERVIEW]: [
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.SELECTED]: [
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.REJECTED]: [
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.UNDER_REVIEW,
  ],
  [APPLICATION_STATUS.WITHDRAWN]: [],
};

export function isValidApplicationStatusTransition(
  currentStatus: string,
  targetStatus: string,
  userRole?: string
): boolean {
  if (currentStatus === APPLICATION_STATUS.WITHDRAWN) {
    return false;
  }
  // Admin role override (except withdrawn applications which are candidate-revoked)
  if (userRole === ROLES.ADMIN) {
    return true;
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(targetStatus);
}

export class ApplicationService {
  // 1. Submit Application (Section 45 & 50)
  static async applyJob(candidateId: string, input: ApplyJobInput) {
    const job = await Job.findById(input.jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job posting not found.',
      };
    }

    if (job.status !== 'published') {
      throw {
        statusCode: 400,
        code: ERROR_CODES.APPLICATION_CLOSED,
        message: 'This job posting is no longer accepting applications.',
      };
    }

    if (new Date(job.applicationDeadline) < new Date()) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.APPLICATION_CLOSED,
        message: 'The application deadline for this job has expired.',
      };
    }

    // Service-level duplicate check (Section 45)
    const existing = await Application.findOne({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      jobId: job._id,
    });

    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.APPLICATION_DUPLICATE,
        message: 'You have already submitted an application for this job.',
      };
    }

    let application;
    try {
      application = await Application.create({
        candidateId: new mongoose.Types.ObjectId(candidateId),
        jobId: job._id,
        resumeUrl: input.resumeUrl,
        coverLetter: input.coverLetter,
        status: 'applied',
        appliedAt: new Date(),
      });
    } catch (err: any) {
      // Catch DB-level compound unique index race conditions (Section 45 & 6A.56)
      if (err.code === 11000) {
        throw {
          statusCode: 409,
          code: ERROR_CODES.APPLICATION_DUPLICATE,
          message: 'You have already submitted an application for this job.',
        };
      }
      throw err;
    }

    // Increment applicants counter
    await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });

    // Create Notification for the Recruiter
    await Notification.create({
      userId: job.recruiterId,
      type: 'application_update',
      title: 'New Applicant Received',
      message: `A candidate has applied for "${job.title}".`,
      data: { jobId: job._id, applicationId: application._id },
    });

    // Real-Time Event via Redis Pub/Sub (Section 13.6, 14)
    await redisService.publish(
      'jobconnect:events',
      JSON.stringify({
        event: 'notification:new',
        recipientUserId: job.recruiterId.toString(),
        payload: {
          title: 'New Applicant Received',
          message: `A candidate has applied for "${job.title}".`,
          jobId: job._id.toString(),
        },
      })
    );

    // Also notify Admins for real-time applications tracking
    try {
      const admins = await User.find({ role: ROLES.ADMIN }).select('_id');
      if (admins.length > 0) {
        const adminNotifs = admins.map((admin) => ({
          userId: admin._id,
          type: 'application_update' as const,
          title: 'New Candidate Application',
          message: `New application submitted for "${job.title}".`,
          data: { jobId: job._id, applicationId: application._id },
          isRead: false,
          createdAt: new Date(),
        }));
        await Notification.insertMany(adminNotifs);
      }
    } catch {
      // Ignore background notification creation error
    }

    return application;
  }

  // 2. Candidate: View own applications
  static async getMyApplications(candidateId: string) {
    const apps = await Application.find({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      status: { $ne: 'withdrawn' },
    })
      .sort({ appliedAt: -1 })
      .populate('jobId', 'title location remoteType employmentType companyId status applicationDeadline')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'name logoUrl location' },
      });

    // Remove any orphaned applications where the job was deleted
    return apps.filter((app) => app.jobId !== null && app.jobId !== undefined);
  }

  // 3. View single application with IDOR guard (Section 6.15)
  static async getApplicationById(applicationId: string, userId: string, userRole: string) {
    const app = await Application.findById(applicationId)
      .populate('candidateId', 'name email phoneE164 avatar dateOfBirth highestQualification')
      .populate({
        path: 'candidateId',
        populate: { path: 'userId' },
      })
      .populate('jobId', 'title location remoteType companyId recruiterId status');

    if (!app) {
      throw {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found.',
      };
    }

    // IDOR verification: candidate owns application OR recruiter owns job OR admin
    const isCandidateOwner = (app.candidateId as any)._id?.toString() === userId;
    const isRecruiterOwner = (app.jobId as any).recruiterId?.toString() === userId;

    if (userRole !== ROLES.ADMIN && !isCandidateOwner && !isRecruiterOwner) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have permission to view this application.',
      };
    }

    return app;
  }

  // 4. Candidate: Withdraw application
  static async withdrawApplication(applicationId: string, candidateId: string) {
    const app = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      candidateId: new mongoose.Types.ObjectId(candidateId),
    });

    if (!app) {
      throw {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found.',
      };
    }

    // Delete any scheduled interviews for this application
    const { Interview } = await import('../models/Interview.js');
    await Interview.deleteMany({ applicationId: app._id });

    // Decrement applicant count on the Job if it exists
    if (app.jobId) {
      await Job.findByIdAndUpdate(app.jobId, {
        $inc: { applicantsCount: -1 },
      });
    }

    // Permanently remove application so it is completely removed from the candidate's list
    await Application.findByIdAndDelete(app._id);

    return { message: 'Application withdrawn and removed from your list successfully.' };
  }

  // 5. Recruiter: View applicants for a specific job (Section 51)
  static async getJobApplicants(jobId: string, recruiterId: string, userRole: string, status?: string) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job posting not found.',
      };
    }

    // Ownership verification
    if (userRole !== ROLES.ADMIN && job.recruiterId.toString() !== recruiterId) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only view applicants for your own job postings.',
      };
    }

    const filter: Record<string, unknown> = { jobId: job._id };
    if (status) {
      filter.status = status;
    }

    const applicants = await Application.find(filter)
      .sort({ appliedAt: -1 })
      .populate('candidateId', 'name email phoneE164 avatar dateOfBirth highestQualification');

    return applicants;
  }

  // 6. Recruiter: Update Hiring Stage Pipeline (Section 51)
  static async updateStatus(
    applicationId: string,
    recruiterId: string,
    userRole: string,
    input: UpdateApplicationStatusInput
  ) {
    const app = await Application.findById(applicationId).populate('jobId', 'title recruiterId');
    if (!app) {
      throw {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found.',
      };
    }

    const job = app.jobId as any;
    if (userRole !== ROLES.ADMIN && job.recruiterId.toString() !== recruiterId) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You are not authorized to update applications for this job.',
      };
    }

    const currentStatus = app.status;

    // Terminal state guard: Withdrawn cannot be modified
    if (currentStatus === APPLICATION_STATUS.WITHDRAWN) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Cannot update an application that has been withdrawn by the candidate.',
      };
    }

    // State machine transition validation
    if (!isValidApplicationStatusTransition(currentStatus, input.status, userRole)) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Illegal application status transition from "${currentStatus}" to "${input.status}". Allowed transitions: ${allowed.join(', ') || 'none'}.`,
      };
    }

    const isStatusChanged = currentStatus !== input.status;
    app.status = input.status as ApplicationStatus;
    if (input.note) {
      app.recruiterNotes.push({
        authorId: new mongoose.Types.ObjectId(recruiterId),
        note: input.note,
        createdAt: new Date(),
      });
    }

    await app.save();

    // Audit log state change
    if (isStatusChanged) {
      try {
        await AuditLog.create({
          actorUserId: new mongoose.Types.ObjectId(recruiterId),
          action: 'APPLICATION_STATUS_UPDATED',
          resourceType: 'Application',
          resourceId: app._id.toString(),
          metadata: {
            jobId: job._id?.toString() || job.id,
            previousStatus: currentStatus,
            newStatus: input.status,
            note: input.note || null,
          },
        });
      } catch {}
    }

    // Create Candidate notification
    const stageTitles: Record<string, string> = {
      under_review: 'Application Under Review',
      shortlisted: 'Congratulations! Application Shortlisted',
      interview: 'Interview Stage Reached',
      selected: 'Congratulations! You Have Been Selected',
      rejected: 'Application Status Update',
    };

    const notifTitle = stageTitles[input.status] || 'Application Status Updated';
    const notifMessage = `Your application for "${job.title}" has been moved to: ${input.status.toUpperCase().replace('_', ' ')}.`;

    await Notification.create({
      userId: app.candidateId,
      type: 'application_update',
      title: notifTitle,
      message: notifMessage,
      data: { applicationId: app._id, newStatus: input.status },
    });

    // Real-Time Event via Redis Pub/Sub
    await redisService.publish(
      'jobconnect:events',
      JSON.stringify({
        event: 'application:status_updated',
        recipientUserId: app.candidateId.toString(),
        payload: {
          applicationId: app._id.toString(),
          jobTitle: job.title,
          newStatus: input.status,
          message: notifMessage,
        },
      })
    );

    return app;
  }

  // 7. Recruiter: Schedule Interview
  static async scheduleInterview(
    recruiterId: string,
    userRole: string,
    input: ScheduleInterviewInput
  ) {
    const app = await Application.findById(input.applicationId).populate('jobId', 'title recruiterId');
    if (!app) {
      throw {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found.',
      };
    }

    const job = app.jobId as any;
    if (userRole !== ROLES.ADMIN && job.recruiterId.toString() !== recruiterId) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You are not authorized to schedule interviews for this job.',
      };
    }

    if (app.status === APPLICATION_STATUS.WITHDRAWN) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Cannot schedule an interview for a withdrawn application.',
      };
    }

    if (app.status === APPLICATION_STATUS.REJECTED) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Cannot schedule an interview for a rejected application. Re-open to under review first.',
      };
    }

    const interview = await Interview.create({
      applicationId: app._id,
      candidateId: new mongoose.Types.ObjectId(input.candidateId),
      recruiterId: new mongoose.Types.ObjectId(recruiterId),
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration,
      meetingUrl: input.meetingUrl,
      notes: input.notes,
      status: 'scheduled',
    });

    // Automatically advance application status to interview stage
    app.status = 'interview';
    await app.save();

    // Create Notification
    const notifMessage = `An interview for "${job.title}" has been scheduled for ${new Date(input.scheduledAt).toLocaleString()}.`;
    await Notification.create({
      userId: app.candidateId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: notifMessage,
      data: { interviewId: interview._id, meetingUrl: input.meetingUrl },
    });

    // Real-Time Event via Redis Pub/Sub
    await redisService.publish(
      'jobconnect:events',
      JSON.stringify({
        event: 'interview:scheduled',
        recipientUserId: app.candidateId.toString(),
        payload: {
          interviewId: interview._id.toString(),
          scheduledAt: input.scheduledAt,
          meetingUrl: input.meetingUrl,
          message: notifMessage,
        },
      })
    );

    return interview;
  }

  // 8. Recruiter: Get All Applicants across their jobs (optionally filtered by status)
  static async getAllRecruiterApplicants(recruiterId: string, userRole: string, status?: string) {
    let jobFilter: Record<string, unknown> = {};
    if (userRole !== ROLES.ADMIN) {
      jobFilter = { recruiterId: new mongoose.Types.ObjectId(recruiterId) };
    }
    const recruiterJobs = await Job.find(jobFilter).select('_id title companyId location employmentType');
    const jobIds = recruiterJobs.map((j) => j._id);

    const appFilter: Record<string, unknown> = { jobId: { $in: jobIds } };
    if (status && status !== 'all') {
      appFilter.status = status;
    }

    const applicants = await Application.find(appFilter)
      .sort({ appliedAt: -1 })
      .populate('candidateId', 'name email phoneE164 avatar dateOfBirth highestQualification')
      .populate('jobId', 'title companyId location employmentType');

    return applicants;
  }

  // 9. Recruiter: Get Scheduled Interviews
  static async getRecruiterInterviews(recruiterId: string, userRole: string) {
    let interviewFilter: Record<string, unknown> = {};
    if (userRole !== ROLES.ADMIN) {
      interviewFilter = { recruiterId: new mongoose.Types.ObjectId(recruiterId) };
    }
    const interviews = await Interview.find(interviewFilter)
      .sort({ scheduledAt: 1 })
      .populate('candidateId', 'name email phoneE164 avatar')
      .populate({
        path: 'applicationId',
        select: 'jobId status',
        populate: {
          path: 'jobId',
          select: 'title companyId location employmentType',
        },
      });

    return interviews;
  }
}
