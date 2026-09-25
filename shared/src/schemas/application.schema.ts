import { z } from 'zod';
import { APPLICATION_STATUS } from '../constants/roles.js';

export const ApplyJobSchema = z.object({
  jobId: z.string({ required_error: 'Job ID is required.' }).min(1),
  resumeUrl: z.string({ required_error: 'Resume is required.' }).min(1, 'Valid resume is required.'),
  coverLetter: z.string().max(4000, 'Cover letter cannot exceed 4000 characters.').optional(),
});

export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum([
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ]),
  note: z.string().max(1000).optional(),
});

export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;

export const ScheduleInterviewSchema = z
  .object({
    applicationId: z.string({ required_error: 'Application ID is required.' }),
    candidateId: z.string({ required_error: 'Candidate ID is required.' }),
    scheduledAt: z
      .string({ required_error: 'Scheduled date and time is required.' })
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'Invalid date format.',
      })
      .superRefine((val, ctx) => {
        const interviewDate = new Date(val);
        if (interviewDate < new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Interview cannot be scheduled in the past.',
          });
        }
      }),
    duration: z
      .number({ required_error: 'Duration in minutes is required.' })
      .int()
      .min(15, 'Duration must be at least 15 minutes.')
      .max(240, 'Duration cannot exceed 4 hours.'),
    meetingUrl: z.string().url('Meeting URL must be a valid URL.').optional().or(z.literal('')),
    notes: z.string().max(1000).optional(),
  });

export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewSchema>;
