import { Response, CookieOptions } from 'express';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

export const ACCESS_COOKIE_NAME = 'jobconnect_at';
export const REFRESH_COOKIE_NAME = 'jobconnect_rt';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  domain: isProduction ? env.COOKIE_DOMAIN : undefined,
  path: '/',
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  // Access Token Cookie (15 minutes)
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15m in ms
  });

  // Refresh Token Cookie (7 days)
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...baseCookieOptions,
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseCookieOptions,
  });
}
