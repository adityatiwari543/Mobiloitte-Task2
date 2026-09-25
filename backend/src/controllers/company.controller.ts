import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class CompanyController {
  static async createCompany(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CompanyService.createCompany(req.user.userId, req.body);
      sendSuccess(res, data, 'Company profile created.', 201);
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to create company.', 500);
    }
  }

  static async getCompany(req: Request, res: Response): Promise<void> {
    try {
      const data = await CompanyService.getCompany(req.params.id as string);
      sendSuccess(res, data, 'Company profile retrieved.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || 'COMPANY_NOT_FOUND', error.message || 'Not found.', error.statusCode || 404);
    }
  }

  static async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CompanyService.updateCompany(
        req.params.id as string,
        req.user.userId,
        req.user.role,
        req.body
      );
      sendSuccess(res, data, 'Company updated successfully.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; code?: string; message?: string };
      sendError(res, error.code || ERROR_CODES.FORBIDDEN, error.message || 'Failed.', error.statusCode || 403);
    }
  }

  static async getRecruiterDashboard(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await CompanyService.getRecruiterDashboard(req.user.userId);
      sendSuccess(res, data, 'Recruiter dashboard loaded.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to load recruiter metrics.', 500);
    }
  }
}
