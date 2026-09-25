import { Request, Response } from 'express';
import { ApplicationService } from '../services/application.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class ApplicationController {
  static async applyJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.applyJob(req.user.userId, req.body);
      sendSuccess(res, data, 'Application submitted successfully.', 201);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Application failed.', error.statusCode || 400);
    }
  }

  static async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.getMyApplications(req.user.userId);
      sendSuccess(res, data, 'Applications retrieved.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch applications.', 500);
    }
  }

  static async getApplicationById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.getApplicationById(
        req.params.id as string,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, data, 'Application details retrieved.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async withdrawApplication(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.withdrawApplication(
        req.params.id as string,
        req.user.userId
      );
      sendSuccess(res, data, data.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed.', error.statusCode || 400);
    }
  }

  static async getJobApplicants(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.getJobApplicants(
        req.params.jobId as string,
        req.user.userId,
        req.user.role,
        req.query.status as string
      );
      sendSuccess(res, data, 'Applicants retrieved.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.updateStatus(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body
      );
      sendSuccess(res, data, 'Application stage updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async scheduleInterview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.scheduleInterview(
        req.user.userId,
        req.user.role,
        req.body
      );
      sendSuccess(res, data, 'Interview scheduled successfully.', 201);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async getAllRecruiterApplicants(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.getAllRecruiterApplicants(
        req.user.userId,
        req.user.role,
        req.query.status as string
      );
      sendSuccess(res, data, 'Applicants retrieved successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.INTERNAL_SERVER_ERROR, error.message || 'Failed to fetch applicants.', error.statusCode || 500);
    }
  }

  static async getRecruiterInterviews(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await ApplicationService.getRecruiterInterviews(
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, data, 'Interviews retrieved successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.INTERNAL_SERVER_ERROR, error.message || 'Failed to fetch interviews.', error.statusCode || 500);
    }
  }
}
