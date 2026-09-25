import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { ACCESS_COOKIE_NAME } from '../utils/cookie.js';
import { redisService } from '../services/redis.service.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES, UserRole, ACCOUNT_STATUS } from '@jobconnect/shared';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Try HttpOnly cookie first, then Bearer header
  let token: string | undefined = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
    return;
  }

  // 2. Verify signature & expiration
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Session expired or invalid token.', 401);
    return;
  }

  // 3. Fast O(1) Redis check for revoked session
  const isRevoked = await redisService.exists(`revoked:session:${decoded.sessionId}`);
  if (isRevoked) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'Session has been revoked. Please sign in again.', 401);
    return;
  }

  // 4. Verify user status
  const user = await User.findById(decoded.userId).select('status isActive');
  if (!user || !user.isActive) {
    sendError(res, ERROR_CODES.UNAUTHORIZED, 'User account is no longer active.', 401);
    return;
  }

  if (user.status === ACCOUNT_STATUS.SUSPENDED) {
    sendError(res, ERROR_CODES.ACCOUNT_SUSPENDED, 'Your account has been suspended by administration.', 403);
    return;
  }

  req.user = decoded;
  next();
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        ERROR_CODES.FORBIDDEN,
        `Access denied. Role "${req.user.role}" does not have permission for this resource.`,
        403
      );
      return;
    }

    next();
  };
}
