import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError' || Array.isArray(error?.issues)) {
        const issues = error.issues || [];
        const firstIssue = issues[0];
        const errorMessage = firstIssue ? firstIssue.message : 'Invalid request data.';
        sendError(res, ERROR_CODES.VALIDATION_ERROR, errorMessage, 422, {
          issues: issues.map((i: any) => ({
            field: Array.isArray(i.path) ? i.path.join('.') : '',
            message: i.message,
          })),
        });
        return;
      }
      sendError(res, ERROR_CODES.VALIDATION_ERROR, error?.message || 'Request validation failed.', 400);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as unknown as Request['query'];
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError' || Array.isArray(error?.issues)) {
        const issues = error.issues || [];
        const firstIssue = issues[0];
        const errorMessage = firstIssue ? firstIssue.message : 'Invalid query parameters.';
        sendError(res, ERROR_CODES.VALIDATION_ERROR, errorMessage, 422, {
          issues: error.issues,
        });
        return;
      }
      sendError(res, ERROR_CODES.VALIDATION_ERROR, error?.message || 'Query validation failed.', 400);
    }
  };
}
