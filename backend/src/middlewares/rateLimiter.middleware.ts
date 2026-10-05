import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

export function createRateLimiter(options: {
  windowSeconds: number;
  maxRequests: number;
  prefix: string;
  keyGenerator?: (req: Request) => string;
}) {
  const { windowSeconds, maxRequests, prefix, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Determine key: user ID if authenticated, else client IP
    const clientKey = keyGenerator
      ? keyGenerator(req)
      : req.user?.userId || req.ip || req.socket.remoteAddress || 'unknown-client';

    const rateLimitKey = `ratelimit:${prefix}:${clientKey}`;

    // Atomic INCR + EXPIRE (OWASP ASVS V3 & V13 Concurrency Safe)
    const { count, ttlSeconds } = await redisService.incrementRateLimit(rateLimitKey, windowSeconds);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

    if (count > maxRequests) {
      res.setHeader('Retry-After', ttlSeconds);
      sendError(
        res,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please slow down and try again later.',
        429,
        { retryAfterSeconds: ttlSeconds }
      );
      return;
    }

    next();
  };
}

// 1. Auth limiter: 10 attempts per 15 minutes (Section 6.9)
export const authRateLimiter = createRateLimiter({
  windowSeconds: 15 * 60,
  maxRequests: 10,
  prefix: 'auth',
});

// 2. Strict OTP limiter: 5 attempts per 10 minutes (Section 6.9 & 6A.39)
export const otpRateLimiter = createRateLimiter({
  windowSeconds: 10 * 60,
  maxRequests: 5,
  prefix: 'otp',
});

// 3. AI Endpoint rate limiter: 20 calls per hour (Section 15.7 & 54)
export const aiRateLimiter = createRateLimiter({
  windowSeconds: 60 * 60,
  maxRequests: 20,
  prefix: 'ai',
});

// 4. Public API limiter: 150 requests per 15 minutes
export const generalApiLimiter = createRateLimiter({
  windowSeconds: 15 * 60,
  maxRequests: 150,
  prefix: 'api',
});
