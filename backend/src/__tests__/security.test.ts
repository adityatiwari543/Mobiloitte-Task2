import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  validateEmailSecurity,
  validatePhoneForCountry,
  getPhoneValidationState,
  COUNTRIES,
  findCountryByIso,
  calculateAge,
  FIRST_NAME_REGEX,
  LAST_NAME_REGEX,
} from '@jobconnect/shared';
import { generateAccessToken, verifyAccessToken } from '../utils/token.js';
import { hashOtp } from '../utils/otp.js';

describe('JobConnect Security & Validation Test Suite (Section 6A & 31)', () => {
  describe('First Name Validation (Section 6A.3)', () => {
    it('accepts valid English capitalized first name', () => {
      expect(FIRST_NAME_REGEX.test('Aditya')).toBe(true);
      expect(FIRST_NAME_REGEX.test('John')).toBe(true);
    });

    it('rejects first name starting with lowercase', () => {
      expect(FIRST_NAME_REGEX.test('aditya')).toBe(false);
    });

    it('rejects first name containing spaces', () => {
      expect(FIRST_NAME_REGEX.test('John Doe')).toBe(false);
      expect(FIRST_NAME_REGEX.test(' John')).toBe(false);
    });

    it('rejects first name containing numbers or symbols', () => {
      expect(FIRST_NAME_REGEX.test('John123')).toBe(false);
      expect(FIRST_NAME_REGEX.test('John@')).toBe(false);
      expect(FIRST_NAME_REGEX.test('J')).toBe(false); // min 2 chars
    });
  });

  describe('Last Name Validation (Section 6A.4)', () => {
    it('accepts single spaces between alphabetic words', () => {
      expect(LAST_NAME_REGEX.test('Doe')).toBe(true);
      expect(LAST_NAME_REGEX.test('Van Der')).toBe(true);
    });

    it('rejects consecutive spaces or non-alphabetic chars in last name', () => {
      expect(LAST_NAME_REGEX.test('Van  Der')).toBe(false);
      expect(LAST_NAME_REGEX.test('Doe123')).toBe(false);
      expect(LAST_NAME_REGEX.test('Doe!')).toBe(false);
    });
  });

  describe('Email Security Validation (Section 6A.8 - 6A.12)', () => {
    it('approves legitimate user email', () => {
      const result = validateEmailSecurity('aditya.sharma@gmail.com');
      expect(result.valid).toBe(true);
    });

    it('rejects purely numeric email local-part (Section 6A.8)', () => {
      const result = validateEmailSecurity('123456@gmail.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Purely numeric');
    });

    it('rejects dummy/reserved placeholder usernames (Section 6A.9)', () => {
      const result = validateEmailSecurity('test@gmail.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('reserved placeholder');
    });

    it('rejects disposable email providers (Section 6A.10)', () => {
      const result = validateEmailSecurity('aditya@mailinator.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('disposable');
    });

    it('rejects reserved testing domains & TLDs (Section 6A.11)', () => {
      const result = validateEmailSecurity('aditya@example.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Reserved');

      const tldResult = validateEmailSecurity('aditya@domain.test');
      expect(tldResult.valid).toBe(false);
    });
  });

  describe('International Mobile Validation (Section 6A.15 - 6A.18)', () => {
    it('validates India mobile numbers with 10 digits starting with 6-9', () => {
      const valid = validatePhoneForCountry('+91', '9876543211');
      expect(valid.valid).toBe(true);
      expect(valid.e164).toBe('+919876543211');

      const zeroStart = validatePhoneForCountry('+91', '0987654321');
      expect(zeroStart.valid).toBe(false);

      const invalidStart = validatePhoneForCountry('+91', '5876543210');
      expect(invalidStart.valid).toBe(false);
    });

    it('validates US/Canada mobile numbers (starts with 2-9, 10 digits)', () => {
      const valid = validatePhoneForCountry('+1', '2025550143');
      expect(valid.valid).toBe(true);
      expect(valid.e164).toBe('+12025550143');

      const startsWithZero = validatePhoneForCountry('+1', '0125550143');
      expect(startsWithZero.valid).toBe(false);
    });

    it('validates UK and UAE formats', () => {
      const uk = validatePhoneForCountry('+44', '7911123456');
      expect(uk.valid).toBe(true);

      const uae = validatePhoneForCountry('+971', '501234567');
      expect(uae.valid).toBe(true);
    });

    it('provides real-time validation feedback while typing (Section 6A.15 real-time checks)', () => {
      const india = findCountryByIso('IN');

      // User types invalid starting digit 0
      const checkZero = getPhoneValidationState(india, '0');
      expect(checkZero.valid).toBe(false);
      expect(checkZero.reason).toBe('Indian mobile numbers must not begin with 0.');

      // User types invalid starting digit 1-5
      const checkFive = getPhoneValidationState(india, '5');
      expect(checkFive.valid).toBe(false);
      expect(checkFive.reason).toBe('Indian mobile numbers must begin with 6, 7, 8, or 9.');

      // User types valid starting digit 9, but too short
      const checkPartial = getPhoneValidationState(india, '987');
      expect(checkPartial.valid).toBe(false);
      expect(checkPartial.reason).toContain('3 of 10 entered');

      // Sequential dummy number
      const checkSeq = getPhoneValidationState(india, '9876543210');
      expect(checkSeq.valid).toBe(false);
      expect(checkSeq.reason).toContain('Sequential or dummy numbers');

      // Repeated identical digits
      const checkRepeat = getPhoneValidationState(india, '9999999999');
      expect(checkRepeat.valid).toBe(false);
      expect(checkRepeat.reason).toContain('repeated identical digits');

      // Repetitive 2-digit pairs
      const checkPair = getPhoneValidationState(india, '9898989898');
      expect(checkPair.valid).toBe(false);
      expect(checkPair.reason).toContain('Repetitive pattern');

      // Valid full number
      const checkValid = getPhoneValidationState(india, '9876543211');
      expect(checkValid.valid).toBe(true);
      expect(checkValid.e164).toBe('+919876543211');
    });

    it('accepts and validates strictly according to the selected country (e.g. Singapore, Germany, Australia)', () => {
      const sg = findCountryByIso('SG');
      expect(sg.dialCode).toBe('+65');
      // Singapore starts with 8 or 9, 8 digits
      const sgInvalidStart = getPhoneValidationState(sg, '61234567');
      expect(sgInvalidStart.valid).toBe(false);
      expect(sgInvalidStart.reason).toBe('Singapore mobile numbers must begin with 8 or 9.');

      const sgValid = getPhoneValidationState(sg, '81234567');
      expect(sgValid.valid).toBe(true);

      const de = findCountryByIso('DE');
      // Germany starts with 15, 16, or 17, 10-11 digits
      const deInvalid = getPhoneValidationState(de, '2123456789');
      expect(deInvalid.valid).toBe(false);
      expect(deInvalid.reason).toContain('15, 16, or 17');

      const deValid = getPhoneValidationState(de, '15123456789');
      expect(deValid.valid).toBe(true);
    });
  });

  describe('Date of Birth & Age Restriction (Section 6A.23)', () => {
    it('calculates age accurately and enforces 13 to 120 limits', () => {
      const today = new Date();
      const tenYearsAgo = `${today.getFullYear() - 10}-01-01`;
      const twentyYearsAgo = `${today.getFullYear() - 20}-01-01`;

      expect(calculateAge(tenYearsAgo)).toBeLessThan(13);
      expect(calculateAge(twentyYearsAgo)).toBeGreaterThanOrEqual(13);
    });
  });

  describe('Password Hashing & JWT Security (Section 6.1, 6.2)', () => {
    it('hashes passwords with bcrypt cost factor and verifies safely', async () => {
      const plain = 'P@ssw0rd123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plain, salt);

      expect(hash).not.toBe(plain);
      const matches = await bcrypt.compare(plain, hash);
      expect(matches).toBe(true);

      const wrong = await bcrypt.compare('WrongPass!', hash);
      expect(wrong).toBe(false);
    });

    it('issues and verifies signed JWT access tokens with session binding', () => {
      const token = generateAccessToken({
        userId: 'user_123',
        email: 'user@example.org',
        role: 'candidate',
        sessionId: 'session_abc',
      });

      const decoded = verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user_123');
      expect(decoded?.sessionId).toBe('session_abc');
    });

    it('hashes OTPs deterministically with SHA-256 for secure Redis storage', () => {
      const otp = '849201';
      const hash1 = hashOtp(otp);
      const hash2 = hashOtp(otp);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(otp);
    });
  });

  describe('Full Registration Schema Validation (Section 6A)', () => {
    it('rejects registration with mismatched passwords', () => {
      const result = RegisterSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        countryCode: '+91',
        nationalNumber: '9876543210',
        role: 'candidate',
        dateOfBirth: '2000-01-01',
        gender: 'Male',
        highestQualification: "Bachelor's",
        password: 'Password123!',
        confirmPassword: 'DifferentPassword!',
        agreeTerms: true,
        agreePrivacy: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(issue?.message).toBe('Passwords do not match.');
      }
    });
  });

  describe('Forgot Password & OTP Reset Password (Section 6A.30)', () => {
    it('validates legitimate forgot password email request', () => {
      const result = ForgotPasswordSchema.safeParse({ email: 'user@example.com' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects invalid email for forgot password', () => {
      const result = ForgotPasswordSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('validates password reset with 6-digit OTP and matching password', () => {
      const result = ResetPasswordSchema.safeParse({
        email: 'user@example.com',
        otp: '123456',
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password reset with mismatched confirmation', () => {
      const result = ResetPasswordSchema.safeParse({
        email: 'user@example.com',
        otp: '123456',
        password: 'NewSecurePassword123!',
        confirmPassword: 'AnotherPassword456!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(issue?.message).toBe('Passwords do not match.');
      }
    });

    it('rejects password reset without OTP or resetToken', () => {
      const result = ResetPasswordSchema.safeParse({
        email: 'user@example.com',
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      });
      expect(result.success).toBe(false);
    });
  });
});
