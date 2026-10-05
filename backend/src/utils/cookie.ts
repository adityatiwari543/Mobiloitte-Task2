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
  // Session-scoped cookies: Cleared automatically by browser when session/window closes
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions,
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
