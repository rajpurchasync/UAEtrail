import type { UserRole } from '../domain/enums.js';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from './auth-cookies.js';
import { env } from '../config/env.js';
import { toSharedRole } from './mappers.js';

export const buildAuthResponse = (
  user: { id: string; email: string; role: UserRole },
  tokens: { accessToken: string }
) => ({
  user: {
    id: user.id,
    email: user.email,
    role: toSharedRole(user.role),
  },
  tokens: { accessToken: tokens.accessToken },
});

export const readRefreshToken = (req: {
  cookies?: Record<string, string>;
  body?: { refreshToken?: string };
}): string | null => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.length >= 20) {
    return fromCookie;
  }
  if (env.NODE_ENV !== 'test') {
    return null;
  }
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody.length >= 20) {
    return fromBody;
  }
  return null;
};

export const respondWithAuth = (
  res: import('express').Response,
  status: number,
  user: { id: string; email: string; role: UserRole },
  tokens: { accessToken: string; refreshToken: string },
  extra: Record<string, unknown> = {}
): void => {
  setRefreshCookie(res, tokens.refreshToken);
  res.status(status).json({ ...buildAuthResponse(user, tokens), ...extra });
};

export const respondWithPendingVerification = (
  res: import('express').Response,
  status: number,
  input: {
    email: string;
    expiresAt: Date;
    expiresInSeconds: number;
    message?: string;
  }
): void => {
  clearRefreshCookie(res);
  res.status(status).json({
    message: input.message ?? 'Check your email for a verification code.',
    email: input.email,
    requiresEmailVerification: true,
    expiresAt: input.expiresAt.toISOString(),
    expiresInSeconds: input.expiresInSeconds,
  });
};
