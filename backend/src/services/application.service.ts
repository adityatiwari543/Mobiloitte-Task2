import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { Notification } from '../models/Notification.js';
import { Interview } from '../models/Interview.js';
import { redisService } from './redis.service.js';
import {
  ApplyJobInput,
  UpdateApplicationStatusInput,
  ScheduleInterviewInput,
  ApplicationStatus,
  ERROR_CODES,
  ROLES,
} from '@jobconnect/shared';

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

    return application;
  }

  // 2. Candidate: View own applications
  static async getMyApplications(candidateId: string) {
    return Application.find({
      candidateId: new mongoose.Types.ObjectId(candidateId),
    })
      .sort({ appliedAt: -1 })
      .populate('jobId', 'title location remoteType employmentType companyId status applicationDeadline')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'name logoUrl location' },
      });
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

    if (app.status === 'withdrawn') {
      return { message: 'Application is already withdrawn.' };
    }

    app.status = 'withdrawn';
    await app.save();

    return { message: 'Application withdrawn successfully.' };
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

    app.status = input.status as ApplicationStatus;
    if (input.note) {
      app.recruiterNotes.push({
        authorId: new mongoose.Types.ObjectId(recruiterId),
        note: input.note,
        createdAt: new Date(),
      });
    }

    await app.save();

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
