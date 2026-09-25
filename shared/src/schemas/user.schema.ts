import { z } from 'zod';
import { FIRST_NAME_REGEX, LAST_NAME_REGEX, VALIDATION_LIMITS } from '../constants/validation.js';
import { GENDER_OPTIONS } from '../constants/roles.js';
import { HIGHEST_QUALIFICATIONS } from '../constants/qualifications.js';
import { calculateAge } from './auth.schema.js';

export const UpdateUserSchema = z.object({
  firstName: z
    .string()
    .min(VALIDATION_LIMITS.FIRST_NAME_MIN)
    .max(VALIDATION_LIMITS.FIRST_NAME_MAX)
    .regex(FIRST_NAME_REGEX, 'First Name must begin with an uppercase letter and contain English letters only.')
    .optional(),
  lastName: z
    .string()
    .min(VALIDATION_LIMITS.LAST_NAME_MIN)
    .max(VALIDATION_LIMITS.LAST_NAME_MAX)
    .transform((val) => val.trim().replace(/\s+/g, ' '))
    .refine((val) => LAST_NAME_REGEX.test(val), {
      message: 'Last Name must contain alphabetic words only with single spaces between words.',
    })
    .optional(),
  avatar: z.string().url('Avatar must be a valid URL.').optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format.')
    .superRefine((val, ctx) => {
      const inputDate = new Date(val);
      const today = new Date();
      if (inputDate > today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date of Birth cannot be a future date.' });
        return;
      }
      const age = calculateAge(val);
      if (age < VALIDATION_LIMITS.MIN_AGE_YEARS || age > VALIDATION_LIMITS.MAX_AGE_YEARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Age must be between ${VALIDATION_LIMITS.MIN_AGE_YEARS} and ${VALIDATION_LIMITS.MAX_AGE_YEARS} years.`,
        });
      }
    })
    .optional(),
  gender: z.enum(GENDER_OPTIONS).optional(),
  highestQualification: z.enum(HIGHEST_QUALIFICATIONS).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
