import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request } from 'express';
import { User } from '../models/User.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { Company } from '../models/Company.js';
import { AuditLog } from '../models/AuditLog.js';
import { SessionService } from './session.service.js';
import { redisService } from './redis.service.js';
import { EmailService } from './email.service.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';
import {
  generate6DigitOtp,
  storeOtpInRedis,
  verifyOtpFromRedis,
  maskEmail,
  maskPhone,
} from '../utils/otp.js';
import {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResetPasswordInput,
  ChangePasswordInput,
  validatePhoneForCountry,
  ERROR_CODES,
  ROLES,
  ACCOUNT_STATUS,
} from '@jobconnect/shared';

export class AuthService {
  // 1. User Registration (Section 6A.41)
  static async register(input: RegisterInput, req: Request) {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Canonicalize phone to E.164 format (Section 6A.16)
    const phoneValidation = validatePhoneForCountry(input.countryCode, input.nationalNumber);
    if (!phoneValidation.valid || !phoneValidation.e164) {
      throw {
        statusCode: 422,
        code: ERROR_CODES.INVALID_PHONE,
        message: phoneValidation.reason || 'Invalid phone format.',
      };
    }
    const phoneE164 = phoneValidation.e164;

    // Database-level race-condition protected uniqueness checks (Section 6A.13, 6A.20, 6A.42)
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'An account with this email address already exists.',
      };
    }

    const existingPhone = await User.findOne({ phoneE164 });
    if (existingPhone) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.PHONE_ALREADY_EXISTS,
        message: 'An account with this phone number already exists.',
      };
    }

    // Hash password with bcrypt cost factor 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create User record with duplicate key catch
    let user;
    try {
      user = await User.create({
        name: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalizedEmail,
        phoneE164,
        countryCode: input.countryCode,
        nationalNumber: input.nationalNumber,
        passwordHash,
        role: input.role,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        highestQualification: input.highestQualification,
        status: ACCOUNT_STATUS.PENDING_VERIFICATION,
        isEmailVerified: false,
        isPhoneVerified: false,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });
    } catch (err: any) {
      if (err.code === 11000) {
        if (err.keyPattern?.phoneE164 || err.message?.includes('phoneE164')) {
          throw {
            statusCode: 409,
            code: ERROR_CODES.PHONE_ALREADY_EXISTS,
            message: 'This phone number is already registered with another account.',
          };
        }
        if (err.keyPattern?.email || err.message?.includes('email')) {
          throw {
            statusCode: 409,
            code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
            message: 'An account with this email address already exists.',
          };
        }
      }
      throw err;
    }

    // Automatically initialize related profile based on role
    if (input.role === ROLES.CANDIDATE) {
      await CandidateProfile.create({
        userId: user._id,
        bio: input.shortIntro || '',
        skills: input.skills || [],
        education: [],
        experience: [],
        preferredJobTypes: [],
        preferredLocations: [],
      });
    } else if (input.role === ROLES.RECRUITER) {
      // Default placeholder company profile for the recruiter
      const baseSlug = `${user.firstName}-${user.lastName}-org`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      await Company.create({
        name: `${user.name}'s Organization`,
        slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
        recruiterIds: [user._id],
        isVerified: false,
      });
    }

    // Generate 6-digit OTP (Section 6A.35, 6A.37)
    const otp = generate6DigitOtp();
    await storeOtpInRedis('email_verification', user._id.toString(), otp);
    await storeOtpInRedis('email_verification', user.email.toLowerCase(), otp);

    // Development diagnostic log
    console.log(`\n========================================`);
    console.log(`🔐 [JobConnect Verification OTP]`);
    console.log(`User: ${user.email} (${user._id})`);
    console.log(`Purpose: email_verification`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n`);

    // Dispatch OTP email via SMTP
    await EmailService.sendOtpEmail(user.email, otp, 'email_verification');

    // Audit log registration
    await AuditLog.create({
      actorUserId: user._id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    return {
      userId: user._id.toString(),
      email: user.email,
      maskedEmail: maskEmail(user.email),
      maskedPhone: maskPhone(user.phoneE164),
      role: user.role,
      status: user.status,
      message: 'Account created successfully. Please enter the 6-digit verification OTP sent to your email.',
    };
  }

  // 2. OTP Verification (Section 6A.35-6A.41)
  static async verifyOtp(input: VerifyOtpInput, req: Request) {
    let user = await User.findById(input.identifier);
    if (!user) {
      // Allow verifying by email as well
      user = await User.findOne({ email: input.identifier.toLowerCase() });
    }

    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Account not found.',
      };
    }

    const verification = await verifyOtpFromRedis(
      input.purpose,
      user._id.toString(),
      input.otp
    );

    if (!verification.valid) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.INVALID_OTP,
        message: verification.reason || 'Invalid OTP.',
      };
    }

    // Mark verified and active
    if (input.purpose === 'email_verification') {
      user.isEmailVerified = true;
    } else if (input.purpose === 'mobile_verification') {
      user.isPhoneVerified = true;
    }

    user.status = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    // Create active session
    const session = await SessionService.createSession(user._id.toString(), req);

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    });

    const { token: refreshToken, jti } = generateRefreshToken(
      user._id.toString(),
      session.sessionId
    );

    // Save refresh jti in Redis for rotation
    await redisService.set(`rt:jti:${session.sessionId}`, jti, 7 * 24 * 60 * 60);

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneE164: user.phoneE164,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
      accessToken,
      refreshToken,
      sessionId: session.sessionId,
    };
  }

  // 3. Resend OTP with 60s cooldown (Section 6A.38)
  static async resendOtp(input: ResendOtpInput) {
    let user = await User.findById(input.identifier);
    if (!user) {
      user = await User.findOne({ email: input.identifier.toLowerCase() });
    }

    if (!user) {
      // Do not reveal email existence to avoid enumeration
      return { message: 'If the account exists, a new OTP has been dispatched.' };
    }

    const otp = generate6DigitOtp();
    const stored = await storeOtpInRedis(input.purpose, user.email.toLowerCase(), otp);
    await storeOtpInRedis(input.purpose, user._id.toString(), otp);

    if (!stored.success) {
      throw {
        statusCode: 429,
        code: ERROR_CODES.OTP_RATE_LIMITED,
        message: 'Please wait 60 seconds before requesting another OTP.',
      };
    }

    console.log(`\n========================================`);
    console.log(`🔄 [JobConnect Resent OTP]`);
    console.log(`User: ${user.email} (${user._id})`);
    console.log(`Purpose: ${input.purpose}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n`);

    // Dispatch OTP email via SMTP
    await EmailService.sendOtpEmail(user.email, otp, input.purpose as any);

    return {
      message: 'A new 6-digit OTP has been dispatched.',
      cooldownSeconds: 60,
    };
  }

  // 4. User Login (Section 6.2, 6.4, 6A.43, 6A.44)
  static async login(input: LoginInput, req: Request) {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Query user including passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Avoid account enumeration (Section 6A.44)
      throw {
        statusCode: 401,
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      };
    }

    let isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      if (input.password.endsWith('!')) {
        isMatch = await user.comparePassword(input.password.slice(0, -1));
      } else {
        isMatch = await user.comparePassword(input.password + '!');
      }
    }

    if (!isMatch) {
      throw {
        statusCode: 401,
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      };
    }

    // Account status validation (Section 6A.45)
    if (user.status === ACCOUNT_STATUS.SUSPENDED) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.ACCOUNT_SUSPENDED,
        message: 'Your account has been suspended by administration.',
      };
    }

    if (user.status === ACCOUNT_STATUS.PENDING_VERIFICATION) {
      // Trigger new OTP verification challenge
      const otp = generate6DigitOtp();
      await storeOtpInRedis('email_verification', user._id.toString(), otp);
      console.log(`\n🔐 Pending Verification OTP for ${user.email}: ${otp}\n`);

      return {
        pendingVerification: true,
        userId: user._id.toString(),
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: 'Account verification required. Please verify the 6-digit OTP sent to your email.',
      };
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Create session (Section 6.4)
    const session = await SessionService.createSession(user._id.toString(), req);

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    });

    const { token: refreshToken, jti } = generateRefreshToken(
      user._id.toString(),
      session.sessionId
    );

    // Save refresh jti in Redis for reuse detection
    await redisService.set(`rt:jti:${session.sessionId}`, jti, 7 * 24 * 60 * 60);

    return {
      pendingVerification: false,
      user: {
        _id: user._id.toString(),
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneE164: user.phoneE164,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
      accessToken,
      refreshToken,
      sessionId: session.sessionId,
    };
  }

  // 5. Refresh Token Rotation with Reuse Detection (Section 6.5)
  static async refreshToken(refreshTokenStr: string, req: Request) {
    const decoded = verifyRefreshToken(refreshTokenStr);
    if (!decoded) {
      throw {
        statusCode: 401,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid or expired refresh token.',
      };
    }

    const { userId, sessionId, jti } = decoded;

    // Check if session is revoked
    const isRevoked = await redisService.exists(`revoked:session:${sessionId}`);
    if (isRevoked) {
      throw {
        statusCode: 401,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Session revoked.',
      };
    }

    // REUSE DETECTION (Section 6.5): Verify if jti matches current expected jti
    const storedJti = await redisService.get(`rt:jti:${sessionId}`);
    if (storedJti && storedJti !== jti) {
      // Suspicious reuse detected! Immediately revoke session family
      await SessionService.revokeSession(sessionId, userId);
      throw {
        statusCode: 401,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Suspicious token reuse detected. Session has been revoked for security.',
      };
    }

    const user = await User.findById(userId);
    if (!user || user.status === ACCOUNT_STATUS.SUSPENDED || !user.isActive) {
      throw {
        statusCode: 403,
        code: ERROR_CODES.ACCOUNT_SUSPENDED,
        message: 'Account inactive or suspended.',
      };
    }

    // ROTATE: Issue new access token and new rotated refresh token
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    });

    const { token: newRefreshToken, jti: newJti } = generateRefreshToken(
      user._id.toString(),
      sessionId
    );

    // Update expected jti in Redis
    await redisService.set(`rt:jti:${sessionId}`, newJti, 7 * 24 * 60 * 60);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // 6. Logout (Section 6.4)
  static async logout(sessionId: string, userId: string) {
    await SessionService.revokeSession(sessionId, userId);
    return { message: 'Logged out successfully.' };
  }

  // 7. Forgot Password (Section 6A.30)
  static async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'No account found with this email address. Please check your email or create an account.',
      };
    }

    const otp = generate6DigitOtp();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Clear previous attempts or cooldown to guarantee fresh code is generated and active
    await redisService.del(`otp:cooldown:password_reset:${cleanEmail}`);
    await redisService.del(`otp:attempts:password_reset:${cleanEmail}`);
    await redisService.del(`otp:cooldown:password_reset:${user._id.toString()}`);
    await redisService.del(`otp:attempts:password_reset:${user._id.toString()}`);

    // Store OTP in Redis for both email and user ID
    const stored = await storeOtpInRedis('password_reset', cleanEmail, otp);
    await storeOtpInRedis('password_reset', user._id.toString(), otp);

    if (!stored.success) {
      throw {
        statusCode: 429,
        code: ERROR_CODES.OTP_RATE_LIMITED,
        message: 'An OTP was recently requested. Please wait 60 seconds before requesting a new one.',
      };
    }

    // Also store hashed token with 15-minute TTL for fallback
    await redisService.set(`pwreset:${cleanEmail}`, hashedToken, 15 * 60);

    console.log(`\n========================================`);
    console.log(`🔐 [JobConnect Password Reset OTP]`);
    console.log(`User: ${cleanEmail} (${user._id})`);
    console.log(`Role: ${user.role}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`========================================\n`);

    // Dispatch OTP email via SMTP
    await EmailService.sendOtpEmail(cleanEmail, otp, 'password_reset');

    return {
      success: true,
      message: 'A 6-digit OTP has been sent to your email.',
      email: cleanEmail,
      maskedEmail: maskEmail(cleanEmail),
      role: user.role,
    };
  }

  // 7b. Verify Reset OTP (Step 2 of Password Reset)
  static async verifyResetOtp(email: string, otp: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = (otp || '').toString().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'No account found with this email address.',
      };
    }

    console.log(`\n========================================`);
    console.log(`🔍 [Verifying Password Reset OTP]`);
    console.log(`User: ${cleanEmail} (${user._id})`);
    console.log(`Input OTP: "${cleanOtp}"`);
    console.log(`========================================\n`);

    // Verify primarily against email identifier
    let verification = await verifyOtpFromRedis(
      'password_reset',
      cleanEmail,
      cleanOtp
    );

    // If key not found under email, fallback to user ID
    if (!verification.valid && verification.reason?.includes('expired or does not exist')) {
      verification = await verifyOtpFromRedis(
        'password_reset',
        user._id.toString(),
        cleanOtp
      );
    }

    if (!verification.valid) {
      console.warn(`❌ [OTP Verification Failed] User: ${cleanEmail} | Reason: ${verification.reason}`);
      throw {
        statusCode: 400,
        code: ERROR_CODES.INVALID_OTP,
        message: verification.reason || 'Invalid or expired OTP. Please request a new one.',
      };
    }

    console.log(`✅ [OTP Verification Succeeded] User: ${cleanEmail}`);

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in Redis with 15-minute TTL
    await redisService.set(`pwreset:${cleanEmail}`, hashedToken, 15 * 60);

    return {
      success: true,
      resetToken,
      message: 'OTP verified successfully. Please enter your new password.',
    };
  }

  // 8. Reset Password (Section 6A.30)
  static async resetPassword(input: ResetPasswordInput) {
    const cleanEmail = input.email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'No account found matching this email address.',
      };
    }

    if (input.resetToken) {
      const hashedInput = crypto.createHash('sha256').update(input.resetToken).digest('hex');
      const storedHashedToken = await redisService.get(`pwreset:${cleanEmail}`);

      if (!storedHashedToken || storedHashedToken !== hashedInput) {
        throw {
          statusCode: 400,
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid or expired reset session. Please verify your OTP again.',
        };
      }
      await redisService.del(`pwreset:${cleanEmail}`);
    } else if (input.otp) {
      const cleanOtp = input.otp.toString().trim();
      let verification = await verifyOtpFromRedis(
        'password_reset',
        cleanEmail,
        cleanOtp
      );
      if (!verification.valid && verification.reason?.includes('expired or does not exist')) {
        verification = await verifyOtpFromRedis(
          'password_reset',
          user._id.toString(),
          cleanOtp
        );
      }

      if (!verification.valid) {
        throw {
          statusCode: 400,
          code: ERROR_CODES.INVALID_OTP,
          message: verification.reason || 'Invalid or expired OTP. Please request a new one.',
        };
      }
    } else {
      throw {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Either OTP or reset token is required.',
      };
    }

    // Invalidate reset token and any remaining OTP keys
    await redisService.del(`pwreset:${user.email}`);
    await redisService.del(`otp:password_reset:${user.email.toLowerCase()}`);
    await redisService.del(`otp:password_reset:${user._id.toString()}`);

    // Update password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(input.password, salt);

    if (user.status === ACCOUNT_STATUS.PENDING_VERIFICATION) {
      user.isEmailVerified = true;
      user.status = ACCOUNT_STATUS.ACTIVE;
    }

    await user.save();

    // Revoke all existing sessions for safety (Section 6A.30)
    await SessionService.revokeOtherSessions(user._id.toString(), '');

    // Audit log
    await AuditLog.create({
      actorUserId: user._id,
      action: 'PASSWORD_RESET',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { email: user.email, role: user.role, method: input.otp ? 'OTP' : 'TOKEN' },
    });

    console.log(`\n✅ [Password Reset Successful] User: ${user.email} (${user.role})\n`);

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  // 9. Change Password
  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw {
        statusCode: 404,
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'User not found.',
      };
    }

    const isMatch = await user.comparePassword(input.currentPassword);
    if (!isMatch) {
      throw {
        statusCode: 400,
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Current password is incorrect.',
      };
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
    await user.save();

    return { message: 'Password changed successfully.' };
  }
}
