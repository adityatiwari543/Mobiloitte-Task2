import { Request, Response } from 'express';
import { CandidateService } from '../services/candidate.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class CandidateController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CandidateService.getProfile(req.user.userId);
      sendSuccess(res, data, 'Profile retrieved successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch candidate profile.', 500);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CandidateService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, data, 'Profile updated successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to update candidate profile.', 500);
    }
  }

  static async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      if (!req.file) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'No resume file provided.', 400);
        return;
      }
      const data = await CandidateService.uploadResume(req.user.userId, req.file);
      sendSuccess(res, data, 'Resume uploaded successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(
        res,
        error.code || ERROR_CODES.VALIDATION_ERROR,
        error.message || 'Resume upload failed.',
        error.statusCode || 400
      );
    }
  }

  static async removeResume(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CandidateService.removeResume(req.user.userId);
      sendSuccess(res, data, 'Resume deleted.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to delete resume.', 500);
    }
  }

  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CandidateService.getDashboard(req.user.userId);
      sendSuccess(res, data, 'Candidate dashboard loaded.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to load candidate dashboard.', 500);
    }
  }
}
