import type { UserRole } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import {
  EMAIL_VERIFICATION_OTP_TTL_MS,
  EMAIL_VERIFICATION_OTP_TTL_SECONDS,
} from '../lib/auth-constants.js';
import { env } from '../config/env.js';
import { generateEmailOtp } from '../lib/hash.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import { toSharedRole } from '../lib/mappers.js';
import { sendVerificationEmail } from '../lib/email.js';
import { createEmailVerificationToken, createRefreshToken } from './auth-session-commands.js';
import { updateAuthUserCore } from './member-identity-commands.js';

export const issueEmailVerificationOtp = async (input: {
  userId: string;
  email: string;
  displayName: string;
}) => {
  const otp = generateEmailOtp();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_OTP_TTL_MS);

  await createEmailVerificationToken({
    userId: input.userId,
    token: otp,
    expiresAt,
  });

  try {
    const sent = await sendVerificationEmail({
      to: input.email,
      name: input.displayName,
      otp,
    });
    if (!sent) {
      throw new Error('Email transport is not configured.');
    }
  } catch (error) {
    console.error('[auth] Failed to send verification email', {
      email: input.email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ApiError(503, 'email_delivery_failed', 'Could not send verification email. Please try again.');
  }

  return {
    otp,
    expiresAt,
    expiresInSeconds: EMAIL_VERIFICATION_OTP_TTL_SECONDS,
  };
};

/** Role switch is session-only: restore the original role at every new login/refresh. */
export const restoreRoleIfSwitched = async (user: {
  _id: string;
  role: UserRole;
  profile?: { switchedFromRole?: UserRole | null };
}): Promise<UserRole> => {
  const original = user.profile?.switchedFromRole;
  if (!original) return user.role;
  await updateAuthUserCore({ userId: user._id, role: original, profile: { switchedFromRole: null } });
  return original;
};

export const createMemberSession = async (input: {
  userId: string;
  email: string;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const accessToken = signAccessToken({
    sub: input.userId,
    email: input.email,
    role: toSharedRole(input.role),
  });
  const refreshToken = signRefreshToken({ sub: input.userId, email: input.email });
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    userId: input.userId,
    token: refreshToken,
    expiresAt,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return { accessToken, refreshToken };
};
