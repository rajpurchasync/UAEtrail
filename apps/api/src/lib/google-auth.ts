import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  locale: string | null;
}

export const isGoogleAuthConfigured = (): boolean => Boolean(env.GOOGLE_CLIENT_ID);

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(503, 'google_auth_unavailable', 'Google sign-in is not configured.');
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new ApiError(401, 'invalid_google_token', 'Google token is invalid.');
  }

  if (!payload.email_verified) {
    throw new ApiError(401, 'google_email_unverified', 'Google account email is not verified.');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: true,
    displayName: payload.name?.trim() || payload.email.split('@')[0],
    avatarUrl: payload.picture ?? null,
    locale: payload.locale ?? null
  };
};
