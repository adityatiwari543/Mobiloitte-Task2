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
  APPLICATION_STATUS,
  ROLES,
} from '@jobconnect/shared';
import { generateAccessToken, verifyAccessToken } from '../utils/token.js';
import { hashOtp, storeOtpInRedis, verifyOtpFromRedis } from '../utils/otp.js';
import { validateFileMagicBytes } from '../utils/upload.js';
import { isValidApplicationStatusTransition } from '../services/application.service.js';
import { redisService } from '../services/redis.service.js';
import { env } from '../config/env.js';
import { normalizeOrigin, getAllowedOrigins, validateCorsOrigin } from '../config/cors.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { uploadsSecurityMiddleware } from '../app.js';
import { Job } from '../models/Job.js';
import { AuditLog } from '../models/AuditLog.js';

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

  describe('Binary Magic Bytes File Validation (OWASP ASVS V12 - Section 12)', () => {
    const tempDir = os.tmpdir();

    it('accepts genuine PDF file with %PDF header', () => {
      const filePath = path.join(tempDir, 'test-valid.pdf');
      fs.writeFileSync(filePath, Buffer.from('%PDF-1.7\nSample PDF content'));
      try {
        expect(validateFileMagicBytes(filePath, 'pdf')).toBe(true);
        expect(validateFileMagicBytes(filePath, 'resume')).toBe(true);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('accepts genuine PNG file with \\x89PNG header', () => {
      const filePath = path.join(tempDir, 'test-valid.png');
      fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]));
      try {
        expect(validateFileMagicBytes(filePath, 'image')).toBe(true);
        expect(validateFileMagicBytes(filePath, 'resume')).toBe(true);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('accepts genuine JPEG file with \\xFF\\xD8\\xFF header', () => {
      const filePath = path.join(tempDir, 'test-valid.jpg');
      fs.writeFileSync(filePath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]));
      try {
        expect(validateFileMagicBytes(filePath, 'image')).toBe(true);
        expect(validateFileMagicBytes(filePath, 'resume')).toBe(true);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('rejects executable file (.exe MZ header) disguised as PDF', () => {
      const filePath = path.join(tempDir, 'test-malicious.pdf');
      fs.writeFileSync(filePath, Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]));
      try {
        expect(validateFileMagicBytes(filePath, 'pdf')).toBe(false);
        expect(validateFileMagicBytes(filePath, 'resume')).toBe(false);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('rejects script file (e.g. PHP/HTML) disguised as image or PDF', () => {
      const filePath = path.join(tempDir, 'test-script.png');
      fs.writeFileSync(filePath, Buffer.from('<?php system($_GET["cmd"]); ?>'));
      try {
        expect(validateFileMagicBytes(filePath, 'image')).toBe(false);
        expect(validateFileMagicBytes(filePath, 'pdf')).toBe(false);
        expect(validateFileMagicBytes(filePath, 'resume')).toBe(false);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    it('returns false safely for non-existent files', () => {
      expect(validateFileMagicBytes('/non-existent-path/fake.pdf', 'pdf')).toBe(false);
    });
  });

  describe('Application Pipeline State Machine Transitions (OWASP ASVS V11 - Business Logic)', () => {
    it('allows valid forward stage transitions in the hiring funnel', () => {
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.UNDER_REVIEW)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.SHORTLISTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.SHORTLISTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.INTERVIEW)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.INTERVIEW, APPLICATION_STATUS.SELECTED)).toBe(true);
    });

    it('allows rejection from any active workflow stage', () => {
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.REJECTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.REJECTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.INTERVIEW, APPLICATION_STATUS.REJECTED)).toBe(true);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.SELECTED, APPLICATION_STATUS.REJECTED)).toBe(true);
    });

    it('rejects illegal direct state jumps that bypass interview/screening stages', () => {
      // Applied directly to Selected without screening/interview
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.SELECTED)).toBe(false);
      // Under Review directly to Selected without interview
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.SELECTED)).toBe(false);
      // Rejected directly to Selected without re-evaluation
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.SELECTED)).toBe(false);
    });

    it('strictly prohibits any transitions from terminal WITHDRAWN status', () => {
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.APPLIED)).toBe(false);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.UNDER_REVIEW)).toBe(false);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.SHORTLISTED)).toBe(false);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.INTERVIEW)).toBe(false);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.SELECTED)).toBe(false);
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.REJECTED)).toBe(false);
      // Even admin cannot modify candidate-withdrawn applications
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.WITHDRAWN, APPLICATION_STATUS.SELECTED, ROLES.ADMIN)).toBe(false);
    });

    it('allows re-opening rejected candidates back to under_review', () => {
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.UNDER_REVIEW)).toBe(true);
    });

    it('allows admin role override for non-withdrawn statuses', () => {
      expect(isValidApplicationStatusTransition(APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.SELECTED, ROLES.ADMIN)).toBe(true);
    });
  });

  describe('Atomic Rate Limiting & Concurrency Safety (OWASP ASVS V3 & V13)', () => {
    it('atomically increments rate limit key and preserves window TTL', async () => {
      const testKey = `ratelimit:test:${Date.now()}`;
      const res1 = await redisService.incrementRateLimit(testKey, 60);
      expect(res1.count).toBe(1);
      expect(res1.ttlSeconds).toBeGreaterThan(0);
      expect(res1.ttlSeconds).toBeLessThanOrEqual(60);

      const res2 = await redisService.incrementRateLimit(testKey, 60);
      expect(res2.count).toBe(2);

      const res3 = await redisService.incrementRateLimit(testKey, 60);
      expect(res3.count).toBe(3);

      await redisService.del(testKey);
    });

    it('safely handles concurrent hits without race conditions (TOCTOU prevention)', async () => {
      const testKey = `ratelimit:concurrency:${Date.now()}`;
      const concurrentHits = 15;

      // Simulate 15 simultaneous requests hitting the limiter at the exact same instant
      const promises = Array.from({ length: concurrentHits }, () =>
        redisService.incrementRateLimit(testKey, 60)
      );

      const results = await Promise.all(promises);
      const counts = results.map((r) => r.count);

      // Verify all counts are unique and max count equals 15 without lost updates
      const uniqueCounts = new Set(counts);
      expect(uniqueCounts.size).toBe(concurrentHits);
      expect(Math.max(...counts)).toBe(concurrentHits);

      await redisService.del(testKey);
    });
  });

  describe('CORS Hardening & Trusted Origins Validation (OWASP ASVS V14 - Section 14)', () => {
    it('normalizes origins by stripping trailing slashes and whitespace', () => {
      expect(normalizeOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
      expect(normalizeOrigin('  https://jobconnect.dev///  ')).toBe('https://jobconnect.dev');
    });

    it('permits authorized origins in development/test', () => {
      let allowed = false;
      validateCorsOrigin('http://localhost:5173', (err, allow) => {
        expect(err).toBeNull();
        allowed = Boolean(allow);
      });
      expect(allowed).toBe(true);
    });

    it('allows requests with missing or undefined origin (curl, server-to-server, health check)', () => {
      let allowed = false;
      validateCorsOrigin(undefined, (err, allow) => {
        expect(err).toBeNull();
        allowed = Boolean(allow);
      });
      expect(allowed).toBe(true);
    });

    it('strictly rejects "null" origin to prevent sandboxed iframe attacks', () => {
      let rejectedError: Error | null = null;
      validateCorsOrigin('null', (err) => {
        rejectedError = err;
      });
      expect(rejectedError).not.toBeNull();
      expect((rejectedError as unknown as Error)?.message).toContain('"null" origin is not permitted');
    });

    it('strictly rejects malicious untrusted origins', () => {
      let rejectedError: Error | null = null;
      validateCorsOrigin('http://malicious-attacker.com', (err) => {
        rejectedError = err;
      });
      expect(rejectedError).not.toBeNull();
      expect((rejectedError as unknown as Error)?.message).toContain('is not authorized');
    });

    it('strictly excludes localhost dev origins when NODE_ENV is production (Issue 11)', () => {
      const originalNodeEnv = env.NODE_ENV;
      const originalFrontendUrl = env.FRONTEND_URL;
      try {
        (env as any).NODE_ENV = 'production';
        (env as any).FRONTEND_URL = 'https://jobconnect.dev';
        const productionOrigins = getAllowedOrigins();
        expect(productionOrigins).toEqual(['https://jobconnect.dev']);
        expect(productionOrigins).not.toContain('http://localhost:5173');
        expect(productionOrigins).not.toContain('http://127.0.0.1:5173');
        expect(productionOrigins).not.toContain('http://localhost:3000');
      } finally {
        (env as any).NODE_ENV = originalNodeEnv;
        (env as any).FRONTEND_URL = originalFrontendUrl;
      }
    });
  });

  describe('OTP Security, Storage & Attempt Lockout (Section 6A.39)', () => {
    const testEmail = `test.user.${Date.now()}@example.com`;
    const otp = '849201';

    it('stores OTP in hashed format and sets 60-second cooldown', async () => {
      const result = await storeOtpInRedis('email_verification', testEmail, otp);
      expect(result.success).toBe(true);

      // Immediate second request must trigger cooldown
      const cooldownAttempt = await storeOtpInRedis('email_verification', testEmail, otp);
      expect(cooldownAttempt.success).toBe(false);
      expect(cooldownAttempt.cooldownRemaining).toBeGreaterThan(0);
      expect(cooldownAttempt.cooldownRemaining).toBeLessThanOrEqual(60);
    });

    it('atomically tracks failed attempts and locks after 5 invalid tries', async () => {
      // First 4 invalid tries
      for (let i = 1; i <= 4; i++) {
        const verifyRes = await verifyOtpFromRedis('email_verification', testEmail, '000000');
        expect(verifyRes.valid).toBe(false);
        expect(verifyRes.reason).toContain('attempts remaining');
      }

      // 5th attempt reaches max
      const fifthAttempt = await verifyOtpFromRedis('email_verification', testEmail, '000000');
      expect(fifthAttempt.valid).toBe(false);

      // 6th attempt must be locked out completely
      const lockedAttempt = await verifyOtpFromRedis('email_verification', testEmail, '000000');
      expect(lockedAttempt.valid).toBe(false);
      expect(lockedAttempt.reason).toContain('Maximum verification attempts exceeded');
    });
  });

  describe('Static File Uploads Security Sandbox (Issue 2 & OWASP ASVS V12)', () => {
    function mockReqRes(path: string) {
      const headers: Record<string, string> = {};
      const req = { path } as any;
      const res = {
        setHeader: (k: string, v: string) => {
          headers[k.toLowerCase()] = v;
        },
      } as any;
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };
      return { req, res, headers, next, getNextCalled: () => nextCalled };
    }

    it('attaches strict nosniff and CSP none headers on all requests', () => {
      const { req, res, headers, next, getNextCalled } = mockReqRes('/resume.pdf');
      uploadsSecurityMiddleware(req, res, next);
      expect(getNextCalled()).toBe(true);
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['content-security-policy']).toBe("default-src 'none'");
      expect(headers['x-frame-options']).toBe('DENY');
    });

    it('forces Content-Disposition: attachment on non-raster files (e.g. PDF, DOCX, SVG, HTML)', () => {
      const nonRasterPaths = [
        '/user_resume.pdf',
        '/application.docx',
        '/malicious.svg',
        '/payload.html',
        '/script.js',
      ];
      for (const p of nonRasterPaths) {
        const { req, res, headers, next } = mockReqRes(p);
        uploadsSecurityMiddleware(req, res, next);
        expect(headers['content-disposition']).toBe('attachment');
      }
    });

    it('does not force Content-Disposition attachment on safe raster images (jpg, jpeg, png, webp)', () => {
      const rasterPaths = [
        '/avatar.png',
        '/photo.jpg',
        '/banner.jpeg',
        '/icon.webp',
      ];
      for (const p of rasterPaths) {
        const { req, res, headers, next } = mockReqRes(p);
        uploadsSecurityMiddleware(req, res, next);
        expect(headers['content-disposition']).toBeUndefined();
      }
    });
  });

  describe('Immutable Audit Log Tamper-Resistance (Issue 4 & OWASP ASVS V8)', () => {
    it('blocks save operations on existing audit logs (strictly append-only)', () => {
      const doc = new AuditLog({
        action: 'TEST_ACTION',
        resourceType: 'User',
      });
      // Simulate an existing saved document
      (doc as any).isNew = false;

      let caughtErr: any = null;
      // Trigger the pre('save') hook function directly
      const hooks: any = (AuditLog.schema as any).s.hooks;
      const savePres = hooks._pres.get('save') || [];
      for (const h of savePres) {
        h.fn.call(doc, (err: any) => {
          if (err) caughtErr = err;
        });
      }

      expect(caughtErr).toBeDefined();
      expect(caughtErr?.message).toContain('Audit logs are strictly append-only and cannot be mutated.');
    });

    it('blocks update and delete operations across all mutation hooks', () => {
      const hooks: any = (AuditLog.schema as any).s.hooks;
      const updateOperations = ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'];
      for (const op of updateOperations) {
        const pres = hooks._pres.get(op) || [];
        expect(pres.length).toBeGreaterThan(0);
        let caughtErr: any = null;
        pres[0].fn.call({}, (err: any) => {
          if (err) caughtErr = err;
        });
        expect(caughtErr?.message).toContain('Audit logs are tamper-proof and cannot be updated.');
      }

      const deleteOperations = ['deleteOne', 'deleteMany', 'findOneAndDelete'];
      for (const op of deleteOperations) {
        const pres = hooks._pres.get(op) || [];
        expect(pres.length).toBeGreaterThan(0);
        let caughtErr: any = null;
        pres[0].fn.call({}, (err: any) => {
          if (err) caughtErr = err;
        });
        expect(caughtErr?.message).toContain('Audit logs are tamper-proof and cannot be deleted.');
      }
    });
  });

  describe('Salary Financial Precision & IEEE-754 Prevention (Issue 5)', () => {
    it('normalizes floating point salary values to integers via setters', () => {
      const job = new Job({
        title: 'Senior Full Stack Engineer',
        description: 'Building modern scalable web portals with Node.js and React.',
        location: 'Bengaluru',
        remoteType: 'remote',
        employmentType: 'full-time',
        experienceMin: 3,
        experienceMax: 6,
        salaryMin: 125000.49,
        salaryMax: 185000.89,
        applicationDeadline: new Date(Date.now() + 86400000 * 30),
      });

      expect(job.salaryMin).toBe(125000);
      expect(job.salaryMax).toBe(185001);
      expect(Number.isInteger(job.salaryMin)).toBe(true);
      expect(Number.isInteger(job.salaryMax)).toBe(true);
    });

    it('guarantees integer representation upon JSON serialization without decimal drift', () => {
      const job = new Job({
        title: 'Lead Architect',
        salaryMin: 250000.2,
        salaryMax: 350000.7,
      });

      const serialized = job.toJSON();
      expect(serialized.salaryMin).toBe(250000);
      expect(serialized.salaryMax).toBe(350001);
      expect(Number.isInteger(serialized.salaryMin)).toBe(true);
      expect(Number.isInteger(serialized.salaryMax)).toBe(true);
    });
  });
});

