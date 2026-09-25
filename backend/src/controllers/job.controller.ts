import { Request, Response } from 'express';
import { JobService } from '../services/job.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES, JOB_STATUS } from '@jobconnect/shared';

export class JobController {
  static async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const data = await JobService.listJobs(req.query as any);
      sendSuccess(res, data, 'Jobs retrieved successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to retrieve jobs.', 500);
    }
  }

  static async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const data = await JobService.getJobById(req.params.id as string);
      sendSuccess(res, data, 'Job details retrieved.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.JOB_NOT_FOUND, error.message || 'Not found.', error.statusCode || 404);
    }
  }

  static async createJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.createJob(req.user.userId, req.body);
      sendSuccess(res, data, 'Job created successfully.', 201);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.VALIDATION_ERROR, error.message || 'Failed.', error.statusCode || 400);
    }
  }

  static async updateJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.updateJob(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body
      );
      sendSuccess(res, data, 'Job updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async publishJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.updateStatus(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        JOB_STATUS.PUBLISHED
      );
      sendSuccess(res, data, 'Job published.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async pauseJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.updateStatus(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        JOB_STATUS.PAUSED
      );
      sendSuccess(res, data, 'Job paused.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async closeJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.updateStatus(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        JOB_STATUS.CLOSED
      );
      sendSuccess(res, data, 'Job closed.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.deleteJob(
        req.params.id as string,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, data, data.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async saveJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.saveJob(req.user.userId, req.params.id as string);
      sendSuccess(res, data, data.message);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.JOB_NOT_FOUND, error.message || 'Failed.', error.statusCode || 400);
    }
  }

  static async unsaveJob(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.unsaveJob(req.user.userId, req.params.id as string);
      sendSuccess(res, data, data.message);
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to remove saved job.', 500);
    }
  }

  static async listSavedJobs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await JobService.listSavedJobs(req.user.userId);
      sendSuccess(res, data, 'Saved jobs retrieved.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to list saved jobs.', 500);
    }
  }
}
