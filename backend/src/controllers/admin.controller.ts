import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class AdminController {
  static async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getDashboard();
      sendSuccess(res, data, 'Admin dashboard loaded.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to load admin dashboard.', 500);
    }
  }

  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, role, status, search } = req.query;
      const data = await AdminService.listUsers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        role: role as string,
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, data, 'Users list retrieved.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch users.', 500);
    }
  }

  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await AdminService.updateUserStatus(
        req.params.id as string,
        req.body.status,
        req.user.userId
      );
      sendSuccess(res, data, 'User status updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || 'USER_NOT_FOUND', error.message || 'Failed.', error.statusCode || 400);
    }
  }

  static async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, status } = req.query;
      const data = await AdminService.listJobs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as string,
      });
      sendSuccess(res, data, 'Jobs retrieved for moderation.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch jobs.', 500);
    }
  }

  static async moderateJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await AdminService.moderateJob(
        req.params.id as string,
        req.body.action,
        req.user.userId
      );
      sendSuccess(res, data, data.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.JOB_NOT_FOUND, error.message || 'Failed.', error.statusCode || 400);
    }
  }

  static async listAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const data = await AdminService.listAuditLogs(
        page ? parseInt(page as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      sendSuccess(res, data, 'Audit logs retrieved.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch audit logs.', 500);
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Admin user not found.', 404);
        return;
      }
      sendSuccess(res, { user }, 'Admin profile loaded.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch admin profile.', 500);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const user = await User.findById(req.user.userId);
      if (!user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Admin user not found.', 404);
        return;
      }

      const { firstName, lastName, phone, countryCode, dateOfBirth, gender, highestQualification } = req.body;

      if (firstName !== undefined) user.firstName = firstName.trim();
      if (lastName !== undefined) user.lastName = lastName.trim();
      if (firstName !== undefined || lastName !== undefined) {
        user.name = `${user.firstName} ${user.lastName}`.trim();
      }
      if (phone !== undefined) {
        user.nationalNumber = phone.replace(/\D/g, '');
        user.phoneE164 = `${countryCode || user.countryCode}${user.nationalNumber}`;
      }
      if (countryCode !== undefined) user.countryCode = countryCode;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (gender !== undefined) user.gender = gender;
      if (highestQualification !== undefined) user.highestQualification = highestQualification;

      await user.save();

      // Log in audit trail
      await AuditLog.create({
        actorUserId: user._id,
        action: 'ADMIN_PROFILE_UPDATED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        metadata: { name: user.name, email: user.email },
      });

      const updatedUser = await User.findById(user._id).select('-passwordHash');
      sendSuccess(res, { user: updatedUser }, 'Admin profile updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed to update admin profile.', 400);
    }
  }
}
