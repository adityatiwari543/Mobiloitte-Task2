import { z } from 'zod';
import { EMPLOYMENT_TYPES } from '../constants/roles.js';

export const CandidateEducationSchema = z.object({
  _id: z.string().optional(),
  degree: z.string().min(1, 'Degree is required.').max(100),
  institution: z.string().min(1, 'Institution is required.').max(150),
  fieldOfStudy: z.string().min(1, 'Field of study is required.').max(100),
  startYear: z.number().int().min(1950).max(new Date().getFullYear()),
  endYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional(),
  grade: z.string().max(50).optional(),
});

export const CandidateExperienceSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Job title is required.').max(100),
  company: z.string().min(1, 'Company name is required.').max(100),
  location: z.string().max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format.'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format.').optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000, 'Description must not exceed 2000 characters.').optional(),
});

export const UpdateProfileSchema = z.object({
  // Personal user fields
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  highestQualification: z.string().optional(),
  avatar: z.string().optional(),

  // Candidate professional fields
  headline: z.string().max(120, 'Headline cannot exceed 120 characters.').optional(),
  bio: z.string().max(3000, 'Bio cannot exceed 3000 characters.').optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string().min(1).max(50)).max(50, 'You can add up to 50 skills.').optional(),
  education: z.array(CandidateEducationSchema).optional(),
  experience: z.array(CandidateExperienceSchema).optional(),
  portfolioUrl: z.string().url('Portfolio must be a valid URL.').optional().or(z.literal('')),
  githubUrl: z.string().url('GitHub must be a valid URL.').optional().or(z.literal('')),
  linkedinUrl: z.string().url('LinkedIn must be a valid URL.').optional().or(z.literal('')),
  preferredJobTypes: z.array(z.enum([EMPLOYMENT_TYPES.FULL_TIME, EMPLOYMENT_TYPES.PART_TIME, EMPLOYMENT_TYPES.CONTRACT, EMPLOYMENT_TYPES.INTERNSHIP])).optional(),
  preferredLocations: z.array(z.string()).max(10).optional(),
  expectedSalary: z
    .object({
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
      currency: z.string().default('INR'),
    })
    .optional(),
  noticePeriod: z.string().max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdateRecruiterProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),

  companyName: z.string().min(1).max(100).optional(),
  avatar: z.string().optional(),
  companyWebsite: z.string().url('Website must be a valid URL.').optional().or(z.literal('')),
  companyIndustry: z.string().max(100).optional(),
  companyLocation: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  companyDescription: z.string().max(3000).optional(),
  companyFoundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

export type UpdateRecruiterProfileInput = z.infer<typeof UpdateRecruiterProfileSchema>;

