import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  CreateJobSchema,
  ApplyJobSchema,
  validateEmailSecurity,
  validatePhoneForCountry,
  calculateAge,
  FIRST_NAME_REGEX,
  LAST_NAME_REGEX,
  APPLICATION_STATUS,
  ROLES,
} from '../index.js';

describe('@jobconnect/shared Schema & Validation Rules Suite', () => {
  describe('Name Format Enforcements', () => {
    it('validates capitalized first names without digits or symbols', () => {
      expect(FIRST_NAME_REGEX.test('Aditya')).toBe(true);
      expect(FIRST_NAME_REGEX.test('John')).toBe(true);
      expect(FIRST_NAME_REGEX.test('john')).toBe(false);
      expect(FIRST_NAME_REGEX.test('John123')).toBe(false);
      expect(FIRST_NAME_REGEX.test('John Doe')).toBe(false);
    });

    it('validates last names allowing single spaces between words', () => {
      expect(LAST_NAME_REGEX.test('Tiwari')).toBe(true);
      expect(LAST_NAME_REGEX.test('Van Der')).toBe(true);
      expect(LAST_NAME_REGEX.test('Van  Der')).toBe(false);
      expect(LAST_NAME_REGEX.test('Tiwari123')).toBe(false);
    });
  });

  describe('Email Security Validation (Anti-Disposable & Anti-Placeholder)', () => {
    it('approves legitimate corporate and personal email addresses', () => {
      expect(validateEmailSecurity('aditya.dev@company.org').valid).toBe(true);
      expect(validateEmailSecurity('contact@google.com').valid).toBe(true);
    });

    it('rejects disposable email addresses (Mailinator, 10minutemail, etc.)', () => {
      expect(validateEmailSecurity('hacker@mailinator.com').valid).toBe(false);
      expect(validateEmailSecurity('temp@guerrillamail.com').valid).toBe(false);
    });

    it('rejects dummy/reserved usernames (test, admin, demo, info, etc.)', () => {
      expect(validateEmailSecurity('test@gmail.com').valid).toBe(false);
      expect(validateEmailSecurity('admin@yahoo.com').valid).toBe(false);
    });

    it('rejects purely numeric email local parts', () => {
      expect(validateEmailSecurity('12345678@gmail.com').valid).toBe(false);
    });
  });

  describe('International Phone Validation', () => {
    it('validates India numbers strictly (10 digits starting with 6, 7, 8, 9)', () => {
      const valid = validatePhoneForCountry('+91', '9876543211');
      expect(valid.valid).toBe(true);
      expect(valid.e164).toBe('+919876543211');

      const invalidLeadingZero = validatePhoneForCountry('+91', '0987654321');
      expect(invalidLeadingZero.valid).toBe(false);

      const invalidLeadingDigit = validatePhoneForCountry('+91', '3876543210');
      expect(invalidLeadingDigit.valid).toBe(false);
    });

    it('validates US/Canada numbers (10 digits starting with 2-9)', () => {
      const valid = validatePhoneForCountry('+1', '4155552671');
      expect(valid.valid).toBe(true);
      expect(valid.e164).toBe('+14155552671');

      const invalid = validatePhoneForCountry('+1', '1155552671');
      expect(invalid.valid).toBe(false);
    });
  });

  describe('Date of Birth & Age Calculator', () => {
    it('correctly calculates age given an ISO date string', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const age = calculateAge(birthDate.toISOString().split('T')[0]);
      expect(age).toBe(25);
    });
  });

  describe('Zod Contracts & Input Validation', () => {
    it('validates correct candidate registration schema', () => {
      const validPayload = {
        firstName: 'Aditya',
        lastName: 'Tiwari',
        email: 'aditya.dev@mycompany.com',
        countryCode: '+91',
        nationalNumber: '9876543211',
        dateOfBirth: '1998-05-15',
        role: ROLES.CANDIDATE,
        gender: 'Male',
        highestQualification: "Bachelor's",
        password: 'SuperSecurePassword123!',
        confirmPassword: 'SuperSecurePassword123!',
        agreeTerms: true,
      };
      const result = RegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects candidate registration with mismatched password confirmation', () => {
      const invalidPayload = {
        firstName: 'Aditya',
        lastName: 'Tiwari',
        email: 'aditya.dev@mycompany.com',
        countryCode: '+91',
        nationalNumber: '9876543211',
        dateOfBirth: '1998-05-15',
        role: ROLES.CANDIDATE,
        gender: 'Male',
        highestQualification: 'B.Tech',
        password: 'SuperSecurePassword123!',
        confirmPassword: 'DifferentPassword456!',
        agreeTerms: true,
      };
      const result = RegisterSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('validates standard job application input', () => {
      const validApply = {
        jobId: 'job_id_12345678901234567890',
        resumeUrl: '/uploads/resume-uuid-123.pdf',
        coverLetter: 'I am excited to apply for this role.',
      };
      const result = ApplyJobSchema.safeParse(validApply);
      expect(result.success).toBe(true);
    });
  });
});
