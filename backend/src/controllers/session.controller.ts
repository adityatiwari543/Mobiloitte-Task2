import { Request, Response } from 'express';
import { SessionService } from '../services/session.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class SessionController {
  static async listSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const sessions = await SessionService.getUserSessions(req.user.userId, req.user.sessionId);
      sendSuccess(res, sessions, 'Sessions retrieved successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch sessions.', 500);
    }
  }

  static async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const { sessionId } = req.params;
      if (!sessionId) {
        sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Session ID required.', 400);
        return;
      }

      await SessionService.revokeSession(sessionId, req.user.userId);
      sendSuccess(res, null, 'Session revoked successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to revoke session.', 500);
    }
  }

  static async revokeOtherSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const count = await SessionService.revokeOtherSessions(req.user.userId, req.user.sessionId);
      sendSuccess(res, { revokedCount: count }, 'Logged out from all other devices successfully.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to revoke other sessions.', 500);
    }
  }
}
