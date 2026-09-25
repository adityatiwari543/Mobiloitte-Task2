import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { getStorageDirectory } from '../utils/upload.js';
import { AuthService } from '../services/auth.service.js';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE_NAME } from '../utils/cookie.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { User } from '../models/User.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { Company } from '../models/Company.js';
import { ERROR_CODES, ROLES } from '@jobconnect/shared';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body, req);
      sendSuccess(res, result, result.message, 201);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.VALIDATION_ERROR,
        error.message || 'Registration failed.',
        error.statusCode || 400
      );
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.verifyOtp(req.body, req);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          sessionId: result.sessionId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Account verified and logged in successfully.'
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.INVALID_OTP,
        error.message || 'OTP verification failed.',
        error.statusCode || 400
      );
    }
  }

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.resendOtp(req.body);
      sendSuccess(res, result, result.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.OTP_RATE_LIMITED,
        error.message || 'Unable to resend OTP.',
        error.statusCode || 429
      );
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req);
      if (result.pendingVerification) {
        sendSuccess(res, result, result.message, 200);
        return;
      }
      if (result.accessToken && result.refreshToken) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
      }
      sendSuccess(
        res,
        {
          user: result.user,
          sessionId: result.sessionId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Login successful.'
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.INVALID_CREDENTIALS,
        error.message || 'Login failed.',
        error.statusCode || 401
      );
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!refreshToken) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'No refresh token provided in cookies.', 401);
        return;
      }

      const result = await AuthService.refreshToken(refreshToken, req);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, {
        message: 'Token rotated successfully.',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err: unknown) {
      clearAuthCookies(res);
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.UNAUTHORIZED,
        error.message || 'Session refresh failed.',
        error.statusCode || 401
      );
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.user) {
        await AuthService.logout(req.user.sessionId, req.user.userId);
      }
      clearAuthCookies(res);
      sendSuccess(res, null, 'Logged out successfully.');
    } catch {
      clearAuthCookies(res);
      sendSuccess(res, null, 'Logged out.');
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Not authenticated.', 401);
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'User not found.', 404);
        return;
      }

      let profileData = null;
      if (user.role === ROLES.CANDIDATE) {
        profileData = await CandidateProfile.findOne({ userId: user._id });
      } else if (user.role === ROLES.RECRUITER) {
        profileData = await Company.findOne({ recruiterIds: user._id });
      }

      sendSuccess(res, {
        user,
        profile: profileData,
        sessionId: req.user.sessionId,
      });
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch current user profile.', 500);
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result, result.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed.', 400);
    }
  }

  static async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.verifyResetOtp(req.body.email, req.body.otp);
      sendSuccess(res, result, result.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Verification failed.', 400);
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body);
      sendSuccess(res, result, result.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed.', 400);
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Not authenticated.', 401);
        return;
      }
      const result = await AuthService.changePassword(req.user.userId, req.body);
      sendSuccess(res, result, result.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed.', 400);
    }
  }

  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      if (!req.file) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'No image file provided for avatar.', 400);
        return;
      }
      const user = await User.findById(req.user.userId);
      if (!user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'User not found.', 404);
        return;
      }

      // If previous avatar was an upload, delete it
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldFilename = user.avatar.replace('/uploads/', '');
        const oldPath = path.resolve(getStorageDirectory(), oldFilename);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch {}
        }
      }

      const avatarUrl = `/uploads/${req.file.filename}`;
      user.avatar = avatarUrl;
      await user.save();

      const updatedUser = await User.findById(req.user.userId).select('-passwordHash');
      sendSuccess(res, { user: updatedUser, avatarUrl }, 'Profile picture updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.VALIDATION_ERROR,
        error.message || 'Avatar upload failed.',
        error.statusCode || 400
      );
    }
  }

  static async removeAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const user = await User.findById(req.user.userId);
      if (!user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'User not found.', 404);
        return;
      }

      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldFilename = user.avatar.replace('/uploads/', '');
        const oldPath = path.resolve(getStorageDirectory(), oldFilename);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch {}
        }
      }

      user.avatar = undefined;
      await user.save();

      const updatedUser = await User.findById(req.user.userId).select('-passwordHash');
      sendSuccess(res, { user: updatedUser }, 'Profile picture removed successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to remove avatar.', 500);
    }
  }
}
