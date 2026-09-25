import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export class NotificationController {
  static async listNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await NotificationService.getUserNotifications(req.user.userId);
      sendSuccess(res, data, 'Notifications loaded.');
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch notifications.', 500);
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await NotificationService.markAsRead(req.params.id as string, req.user.userId);
      sendSuccess(res, data, data.message);
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to update notification.', 500);
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
        return;
      }
      const data = await NotificationService.markAllAsRead(req.user.userId);
      sendSuccess(res, data, data.message);
    } catch {
      sendError(res, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to update notifications.', 500);
    }
  }
}
