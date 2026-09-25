import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const CSRF_COOKIE_NAME = 'jobconnect_csrf';

export function csrfTokenGenerator(req: Request, res: Response, next: NextFunction): void {
  // If CSRF cookie doesn't exist, generate a cryptographically random token
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Frontend JavaScript must be able to read this token to send it in X-CSRF-Token header
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt auth bootstrap endpoints if they don't require pre-existing session
  const exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/resend-otp',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/verify-reset-otp',
    '/api/v1/auth/reset-password',
  ];

  if (exemptPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Verify custom Anti-CSRF Header against cookie
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = (req.headers['x-csrf-token'] as string) || (req.headers['x-requested-with'] as string);

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    // Also allow if header is custom XMLHttpRequest from trusted client origin
    if (csrfHeader === 'XMLHttpRequest' && req.headers.origin === env.FRONTEND_URL) {
      return next();
    }
    sendError(res, 'CSRF_VALIDATION_FAILED', 'Invalid or missing CSRF token.', 403);
    return;
  }

  next();
}
