import { z } from 'zod';
import { REMOTE_TYPES, EMPLOYMENT_TYPES, JOB_STATUS } from '../constants/roles.js';

export const BaseJobSchema = z.object({
  title: z
    .string({ required_error: 'Job title is required.' })
    .min(3, 'Job title must be at least 3 characters.')
    .max(120, 'Job title cannot exceed 120 characters.')
    .transform((val) => val.trim()),
  description: z
    .string({ required_error: 'Job description is required.' })
    .min(50, 'Job description must be at least 50 characters to provide sufficient context.')
    .max(20000, 'Job description cannot exceed 20,000 characters.')
    .transform((val) => val.trim()),
  companyId: z.string({ required_error: 'Company ID is required.' }),
  skills: z
    .array(z.string().min(1).max(50))
    .min(1, 'Please specify at least 1 required skill.')
    .max(30, 'Maximum 30 skills can be attached to a job.'),
  location: z
    .string({ required_error: 'Location is required.' })
    .min(2, 'Location is required.')
    .max(100),
  remoteType: z.enum([REMOTE_TYPES.ONSITE, REMOTE_TYPES.REMOTE, REMOTE_TYPES.HYBRID], {
    required_error: 'Remote type is required.',
  }),
  employmentType: z.enum(
    [
      EMPLOYMENT_TYPES.FULL_TIME,
      EMPLOYMENT_TYPES.PART_TIME,
      EMPLOYMENT_TYPES.CONTRACT,
      EMPLOYMENT_TYPES.INTERNSHIP,
    ],
    { required_error: 'Employment type is required.' }
  ),
  experienceMin: z
    .number({ required_error: 'Minimum experience is required.' })
    .int()
    .nonnegative('Minimum experience cannot be negative.')
    .max(40, 'Minimum experience cannot exceed 40 years.'),
  experienceMax: z
    .number({ required_error: 'Maximum experience is required.' })
    .int()
    .nonnegative('Maximum experience cannot be negative.')
    .max(50, 'Maximum experience cannot exceed 50 years.'),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.string().default('INR'),
  status: z
    .enum([
      JOB_STATUS.DRAFT,
      JOB_STATUS.PUBLISHED,
      JOB_STATUS.PAUSED,
      JOB_STATUS.CLOSED,
      JOB_STATUS.EXPIRED,
    ])
    .default(JOB_STATUS.PUBLISHED),
  applicationDeadline: z
    .string({ required_error: 'Application deadline is required.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Application deadline must be in YYYY-MM-DD format.')
    .superRefine((val, ctx) => {
      const deadline = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadline < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Application deadline cannot be in the past.',
        });
      }
    }),
});

export const CreateJobSchema = BaseJobSchema.superRefine((data, ctx) => {
  // Experience validation: min <= max
  if (data.experienceMin > data.experienceMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['experienceMin'],
      message: 'Minimum experience cannot be greater than maximum experience.',
    });
  }

  // Salary validation: min <= max
  if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
    if (data.salaryMin > data.salaryMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMin'],
        message: 'Minimum salary cannot be greater than maximum salary.',
      });
    }
  }
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = BaseJobSchema.partial().extend({
  companyId: z.string().optional(),
});

export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

export const JobFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  skills: z.string().optional(), // comma-separated
  location: z.string().optional(),
  remoteType: z.string().optional(),
  employmentType: z.string().optional(),
  minSalary: z.coerce.number().optional(),
  experience: z.coerce.number().optional(),
  sortBy: z.enum(['newest', 'salary_high', 'salary_low', 'deadline']).default('newest'),
});

export type JobFilterQuery = z.infer<typeof JobFilterQuerySchema>;
