import crypto from 'crypto';
import mongoose from 'mongoose';
import { Job, IJobDocument } from '../models/Job.js';
import { Company } from '../models/Company.js';
import { SavedJob } from '../models/SavedJob.js';
import { redisService } from './redis.service.js';
import {
  CreateJobInput,
  UpdateJobInput,
  JobFilterQuery,
  JobStatus,
  ERROR_CODES,
  ROLES,
} from '@jobconnect/shared';

export class JobService {
  // 1. List / Search Jobs with Redis Caching
  static async listJobs(filters: JobFilterQuery) {
    // Generate deterministic hash key for caching (Section 13.1, 13.2)
    const normalizedFilterStr = JSON.stringify(filters);
    const cacheKey = `jobs:list:${crypto.createHash('sha256').update(normalizedFilterStr).digest('hex')}`;

    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch {
        // Fallback to DB
      }
    }

    const {
      page = 1,
      limit = 20,
      search,
      skills,
      location,
      remoteType,
      employmentType,
      minSalary,
      experience,
      sortBy = 'newest',
    } = filters;

    const query: Record<string, unknown> = {
      status: 'published',
      applicationDeadline: { $gte: new Date() },
    };

    const andConditions: any[] = [];

    // Keyword Search (Job Title, Skills, Description)
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchWords = cleanSearch
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const wordRegexes = searchWords.map((w) => {
        const escW = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escW, 'i');
      });

      // Match full phrase or any of the keywords in title, skills, description
      const searchOr: any[] = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { skills: { $in: wordRegexes } },
        { skills: { $elemMatch: { $regex: new RegExp(escaped, 'i') } } },
        { description: { $regex: new RegExp(escaped, 'i') } },
      ];

      // If multiple words (e.g. "React Developer" or "Frontend Engineer"), match if all keywords appear across title/skills
      if (searchWords.length > 1) {
        searchOr.push({
          $and: searchWords.map((w) => {
            const reg = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            return {
              $or: [
                { title: { $regex: reg } },
                { skills: { $regex: reg } },
                { description: { $regex: reg } },
              ],
            };
          }),
        });
      }

      andConditions.push({ $or: searchOr });
    }

    // Skills Filter (comma separated)
    if (skills) {
      const skillsArr = skills.split(',').map((s) => s.trim().toLowerCase());
      andConditions.push({ skills: { $in: skillsArr } });
    }

    // Location / City / Remote Filter (with Indian tech hub synonyms & remote handling)
    if (location && location.trim()) {
      const loc = location.trim().toLowerCase();
      if (loc.includes('remote')) {
        andConditions.push({
          $or: [
            { remoteType: 'remote' },
            { location: { $regex: /remote/i } },
          ],
        });
      } else {
        // Expand common city synonyms
        let citySynonyms: string[] = [loc];
        if (loc.includes('bangalore') || loc.includes('bengaluru') || loc === 'blr') {
          citySynonyms = ['bangalore', 'bengaluru'];
        } else if (
          loc.includes('delhi') ||
          loc.includes('gurgaon') ||
          loc.includes('gurugram') ||
          loc.includes('noida') ||
          loc.includes('ncr')
        ) {
          citySynonyms = ['delhi', 'gurgaon', 'gurugram', 'noida', 'ncr'];
        } else if (loc.includes('mumbai') || loc.includes('bombay')) {
          citySynonyms = ['mumbai', 'bombay'];
        } else if (loc.includes('hyderabad') || loc === 'hyd') {
          citySynonyms = ['hyderabad'];
        } else if (loc.includes('pune')) {
          citySynonyms = ['pune'];
        } else if (loc.includes('chennai') || loc.includes('madras')) {
          citySynonyms = ['chennai', 'madras'];
        } else if (loc.includes('kolkata') || loc.includes('calcutta')) {
          citySynonyms = ['kolkata', 'calcutta'];
        }

        const cityRegex = new RegExp(citySynonyms.join('|'), 'i');
        andConditions.push({
          location: { $regex: cityRegex },
        });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Remote Type Filter
    if (remoteType) {
      query.remoteType = remoteType;
    }

    // Employment Type Filter
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Salary Filter
    if (minSalary !== undefined) {
      query.salaryMax = { $gte: minSalary };
    }

    // Experience Filter
    if (experience !== undefined) {
      query.experienceMin = { $lte: experience };
      query.experienceMax = { $gte: experience };
    }

    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === 'salary_high') {
      sortOptions.salaryMax = -1;
    } else if (sortBy === 'salary_low') {
      sortOptions.salaryMin = 1;
    } else if (sortBy === 'deadline') {
      sortOptions.applicationDeadline = 1;
    } else {
      sortOptions.createdAt = -1; // Newest
    }

    const clampedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(clampedLimit)
        .populate('companyId', 'name slug logoUrl location industry isVerified')
        .populate('recruiterId', 'name email'),
      Job.countDocuments(query),
    ]);

    const result = {
      items: jobs,
      pagination: {
        page,
        limit: clampedLimit,
        total,
        totalPages: Math.ceil(total / clampedLimit),
        hasNextPage: page * clampedLimit < total,
        hasPrevPage: page > 1,
      },
    };

    // Cache results in Redis for 60 seconds (Section 13.1)
    await redisService.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  // 2. Get Job Details
  static async getJobById(jobId: string) {
    const cacheKey = `jobs:item:${jobId}`;
    const cached = await redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback
      }
    }

    const job = await Job.findById(jobId)
      .populate('companyId', 'name slug logoUrl description website location industry companySize foundedYear isVerified')
      .populate('recruiterId', 'name email');

    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job posting not found.',
      };
    }

    // Increment view count asynchronously
    Job.findByIdAndUpdate(jobId, { $inc: { viewsCount: 1 } }).exec();

    // Cache in Redis for 120 seconds
    await redisService.set(cacheKey, JSON.stringify(job), 120);

    return job;
  }

  // 3. Create Job
  static async createJob(recruiterId: string, input: CreateJobInput) {
    // Verify company
    const company = await Company.findById(input.companyId);
    if (!company) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Company not found.',
      };
    }

    // Ownership check: Recruiter must belong to company
    const isMember = company.recruiterIds.some((id) => id.toString() === recruiterId);
    if (!isMember) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You are not authorized to create jobs for this company.',
      };
    }

    const baseSlug = input.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const job = await Job.create({
      ...input,
      slug,
      recruiterId: new mongoose.Types.ObjectId(recruiterId),
      companyId: company._id,
      skills: input.skills.map((s) => s.toLowerCase().trim()),
      applicationDeadline: new Date(input.applicationDeadline),
    });

    // CACHE INVALIDATION (Section 13.1, 35): Invalidate all job listings
    await redisService.deletePattern('jobs:list:*');

    return job;
  }

  // 4. Update Job
  static async updateJob(jobId: string, recruiterId: string, userRole: string, input: UpdateJobInput) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job posting not found.',
      };
    }

    // IDOR check: Recruiter must be owner, unless Admin
    if (userRole !== ROLES.ADMIN && job.recruiterId.toString() !== recruiterId) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only edit job postings created by your account.',
      };
    }

    if (input.title) job.title = input.title;
    if (input.description) job.description = input.description;
    if (input.location) job.location = input.location;
    if (input.remoteType) job.remoteType = input.remoteType;
    if (input.employmentType) job.employmentType = input.employmentType;
    if (input.experienceMin !== undefined) job.experienceMin = input.experienceMin;
    if (input.experienceMax !== undefined) job.experienceMax = input.experienceMax;
    if (input.salaryMin !== undefined) job.salaryMin = input.salaryMin;
    if (input.salaryMax !== undefined) job.salaryMax = input.salaryMax;
    if (input.skills) job.skills = input.skills.map((s) => s.toLowerCase().trim());
    if (input.status) job.status = input.status;
    if (input.applicationDeadline) job.applicationDeadline = new Date(input.applicationDeadline);

    await job.save();

    // Invalidate caches
    await redisService.del(`jobs:item:${jobId}`);
    await redisService.deletePattern('jobs:list:*');

    return job;
  }

  // 5. Update Status (Publish, Pause, Close)
  static async updateStatus(jobId: string, recruiterId: string, userRole: string, status: JobStatus) {
    return this.updateJob(jobId, recruiterId, userRole, { status });
  }

  // 6. Delete Job
  static async deleteJob(jobId: string, recruiterId: string, userRole: string) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job posting not found.',
      };
    }

    if (userRole !== ROLES.ADMIN && job.recruiterId.toString() !== recruiterId) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You can only delete jobs that you own.',
      };
    }

    await Promise.all([
      Job.findByIdAndDelete(jobId),
      SavedJob.deleteMany({ jobId: job._id }),
    ]);

    // Invalidate caches
    await redisService.del(`jobs:item:${jobId}`);
    await redisService.deletePattern('jobs:list:*');

    return { message: 'Job posting deleted successfully.' };
  }

  // 7. Save / Bookmark Job
  static async saveJob(userId: string, jobId: string) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.JOB_NOT_FOUND,
        message: 'Job not found.',
      };
    }

    try {
      await SavedJob.create({
        userId: new mongoose.Types.ObjectId(userId),
        jobId: job._id,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Already saved
        return { message: 'Job is already saved in bookmarks.' };
      }
      throw err;
    }

    return { message: 'Job saved successfully.' };
  }

  // 8. Remove Bookmark
  static async unsaveJob(userId: string, jobId: string) {
    await SavedJob.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId),
      jobId: new mongoose.Types.ObjectId(jobId),
    });
    return { message: 'Job removed from bookmarks.' };
  }

  // 9. List Saved Jobs
  static async listSavedJobs(userId: string) {
    const saved = await SavedJob.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'name logoUrl location' },
      });

    return saved.map((s) => s.jobId).filter(Boolean);
  }
}
