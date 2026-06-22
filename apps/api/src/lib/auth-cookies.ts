import type { Response } from 'express';
import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'uaetrail_refresh';

const cookiePath = '/api/v1/auth';

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: cookiePath
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: cookiePath });
};
