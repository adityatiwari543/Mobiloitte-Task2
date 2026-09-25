import mongoose from 'mongoose';
import { Company, ICompanyDocument } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { ERROR_CODES, ROLES } from '@jobconnect/shared';

export class CompanyService {
  static async createCompany(recruiterId: string, input: Partial<ICompanyDocument>) {
    const baseSlug = (input.name || 'company')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const company = await Company.create({
      ...input,
      slug,
      recruiterIds: [new mongoose.Types.ObjectId(recruiterId)],
      isVerified: false,
      isActive: true,
    });

    return company;
  }

  static async getCompany(idOrSlug: string) {
    let company;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      company = await Company.findById(idOrSlug);
    } else {
      company = await Company.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!company) {
      throw {
        statusCode: 404,
        code: 'COMPANY_NOT_FOUND',
        message: 'Company profile not found.',
      };
    }

    // Include open jobs
    const jobs = await Job.find({
      companyId: company._id,
      status: 'published',
      applicationDeadline: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    return { company, openJobs: jobs };
  }

  static async updateCompany(
    companyId: string,
    recruiterId: string,
    userRole: string,
    input: Partial<ICompanyDocument>
  ) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw {
        statusCode: 404,
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found.',
      };
    }

    const isMember = company.recruiterIds.some((id) => id.toString() === recruiterId);
    if (userRole !== ROLES.ADMIN && !isMember) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.FORBIDDEN,
        message: 'You are not authorized to update this company.',
      };
    }

    if (input.name) company.name = input.name;
    if (input.logoUrl) company.logoUrl = input.logoUrl;
    if (input.description) company.description = input.description;
    if (input.website) company.website = input.website;
    if (input.industry) company.industry = input.industry;
    if (input.companySize) company.companySize = input.companySize;
    if (input.location) company.location = input.location;
    if (input.foundedYear) company.foundedYear = input.foundedYear;

    await company.save();
    return company;
  }

  static async getRecruiterDashboard(recruiterId: string): Promise<any> {
    const recruiterObjId = new mongoose.Types.ObjectId(recruiterId);

    // Get jobs created by this recruiter
    const recruiterJobs = await Job.find({ recruiterId: recruiterObjId })
      .select('_id title status applicantsCount createdAt location remoteType employmentType')
      .sort({ createdAt: -1 });
    const jobIds = recruiterJobs.map((j) => j._id);

    // Aggregation pipeline for hiring funnel stats and real applicant count per job
    const [funnelStats, totalInterviews, recentApplicants, jobAppCounts] = await Promise.all([
      Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Interview.countDocuments({
        recruiterId: recruiterObjId,
        scheduledAt: { $gte: new Date() },
        status: 'scheduled',
      }),
      Application.find({ jobId: { $in: jobIds } })
        .sort({ appliedAt: -1 })
        .limit(8)
        .populate('candidateId', 'name email avatar phoneE164')
        .populate('jobId', 'title'),
      Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>();
    for (const item of jobAppCounts) {
      countMap.set(item._id.toString(), item.count);
    }

    const computedJobs = recruiterJobs.map((j) => {
      const jobObj = j.toObject ? j.toObject() : j;
      return {
        ...jobObj,
        applicantsCount: countMap.get(j._id.toString()) || 0,
      };
    });

    const funnelMap: Record<string, number> = {
      applied: 0,
      under_review: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
    };

    let totalApplicants = 0;
    for (const stat of funnelStats) {
      funnelMap[stat._id] = stat.count;
      totalApplicants += stat.count;
    }

    const activeJobsCount = recruiterJobs.filter((j) => j.status === 'published').length;

    return {
      activeJobsCount,
      totalJobsCount: recruiterJobs.length,
      totalApplicants,
      upcomingInterviewsCount: totalInterviews,
      funnel: funnelMap,
      recentApplicants,
      jobs: computedJobs,
    };
  }
}
