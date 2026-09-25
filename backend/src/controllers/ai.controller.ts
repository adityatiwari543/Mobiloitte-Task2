import { Request, Response } from 'express';
import { aiService } from '../ai/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class AIController {
  static async summarizeJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Job ID is required.', 400);
        return;
      }
      const data = await aiService.summarizeJob(jobId);
      sendSuccess(res, data, 'Job summary generated.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      sendError(res, 'AI_PROCESSING_ERROR', error.message || 'Failed to summarize job.', error.statusCode || 500);
    }
  }

  static async explainMatch(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const { jobId } = req.body;
      if (!jobId) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Job ID is required.', 400);
        return;
      }
      const data = await aiService.explainMatch(jobId, req.user.userId);
      sendSuccess(res, data, 'Match analysis generated.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      sendError(res, 'AI_PROCESSING_ERROR', error.message || 'Failed to generate match explanation.', error.statusCode || 500);
    }
  }

  static async generateJobDescription(req: Request, res: Response): Promise<void> {
    try {
      const { title, notes, skills, experienceYears } = req.body;
      if (!title || !notes) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Title and notes are required.', 400);
        return;
      }
      const data = await aiService.generateJobDescription({
        title,
        notes,
        skills: Array.isArray(skills) ? skills : [],
        experienceYears,
      });
      sendSuccess(res, data, 'Job description draft generated.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      sendError(res, 'AI_PROCESSING_ERROR', error.message || 'Failed to draft job description.', error.statusCode || 500);
    }
  }

  static async chat(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Query text is required.', 400);
        return;
      }
      const data = await aiService.askCareerAssistant(query, req.user?.userId);
      sendSuccess(res, data, 'Response generated.');
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      sendError(res, 'AI_PROCESSING_ERROR', error.message || 'Career Assistant request failed.', error.statusCode || 500);
    }
  }
}
