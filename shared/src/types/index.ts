import { UserRole, AccountStatus, JobStatus, ApplicationStatus, RemoteType, EmploymentType, Gender } from '../constants/roles.js';
import { HighestQualification } from '../constants/qualifications.js';

export interface IUser {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  countryCode: string;
  nationalNumber: string;
  role: UserRole;
  avatar?: string;
  dateOfBirth?: string;
  gender?: Gender;
  highestQualification?: HighestQualification;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  status: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICandidateEducation {
  _id?: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
  grade?: string;
}

export interface ICandidateExperience {
  _id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface ICandidateProfile {
  _id: string;
  userId: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  education: ICandidateEducation[];
  experience: ICandidateExperience[];
  resumeUrl?: string;
  resumeOriginalName?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  preferredJobTypes: EmploymentType[];
  preferredLocations: string[];
  expectedSalary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  noticePeriod?: string;
  profileCompletionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICompany {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  foundedYear?: number;
  recruiterIds: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IJob {
  _id: string;
  title: string;
  slug: string;
  description: string;
  companyId: string | ICompany;
  recruiterId: string | IUser;
  skills: string[];
  location: string;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: JobStatus;
  applicationDeadline: string;
  viewsCount: number;
  applicantsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IApplication {
  _id: string;
  candidateId: string | IUser;
  jobId: string | IJob;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  recruiterNotes?: Array<{
    authorId: string;
    note: string;
    createdAt: string;
  }>;
  appliedAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: 'application_update' | 'interview_scheduled' | 'job_alert' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface IInterview {
  _id: string;
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISession {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  userAgentMetadata: {
    browser?: string;
    os?: string;
    device?: string;
    rawUserAgent?: string;
  };
  ipMetadata: {
    ip: string;
  };
  revokedAt?: string;
  isCurrent?: boolean;
}

export interface IAuditLog {
  _id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
