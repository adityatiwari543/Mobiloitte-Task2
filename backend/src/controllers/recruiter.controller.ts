import { Request, Response } from 'express';
import { RecruiterService } from '../services/recruiter.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class RecruiterController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await RecruiterService.getProfile(req.user.userId);
      sendSuccess(res, data, 'Recruiter profile retrieved.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.INTERNAL_SERVER_ERROR, error.message || 'Failed to fetch recruiter profile.', error.statusCode || 500);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await RecruiterService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, data, 'Recruiter details saved successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.INTERNAL_SERVER_ERROR, error.message || 'Failed to update recruiter profile.', error.statusCode || 500);
    }
  }
}
