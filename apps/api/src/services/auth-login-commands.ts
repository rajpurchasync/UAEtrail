import type { UserRole } from '../domain/enums.js';
import { UserStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { verifyRefreshToken } from '../lib/jwt.js';
import { verifyPassword } from '../lib/password.js';
import { DEMO_LOGIN_EMAILS } from '../lib/demo-accounts.js';
import {
  revokeRefreshToken,
  useEmailVerificationToken,
} from './auth-session-commands.js';
import {
  findActiveRefreshToken,
  findEmailVerificationTokenForUser,
} from './auth-session-read.js';
import { createMemberSession, issueEmailVerificationOtp, restoreRoleIfSwitched } from './auth-session-flow.js';
import {
  findAuthUserByEmail,
  findAuthUserById,
} from './member-identity-read.js';
import {
  updateAuthUserEmailVerifiedAt,
  updateAuthUserLastActive,
} from './member-identity-commands.js';

export type AuthPendingVerification = {
  kind: 'pending_verification';
  email: string;
  expiresAt: Date;
  expiresInSeconds: number;
  message: string;
};

export type AuthAuthenticatedUser = {
  kind: 'authenticated';
  userId: string;
  email: string;
  role: UserRole;
};

export const loginWithEmailPassword = async (input: {
  email: string;
  password: string;
  demoLoginAllowed: boolean;
}): Promise<AuthPendingVerification | AuthAuthenticatedUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (DEMO_LOGIN_EMAILS.has(normalizedEmail) && !input.demoLoginAllowed) {
    throw new ApiError(
      403,
      'demo_account_restricted',
      'Demo accounts are available only on localhost or test environments.'
    );
  }

  const user = await findAuthUserByEmail(input.email);
  if (!user?.passwordHash) {
    throw new ApiError(401, 'oauth_account', 'This account uses Google sign-in.');
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.');
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(403, 'account_suspended', 'Account is suspended.');
  }

  if (!user.emailVerifiedAt) {
    const verification = await issueEmailVerificationOtp({
      userId: user._id,
      email: user.email,
      displayName: user.profile.displayName ?? user.email,
    });
    return {
      kind: 'pending_verification',
      email: user.email,
      expiresAt: verification.expiresAt,
      expiresInSeconds: verification.expiresInSeconds,
      message: 'Verify your email to finish registration.',
    };
  }

  const sessionRole = await restoreRoleIfSwitched(user);
  await updateAuthUserLastActive(user._id);
  return {
    kind: 'authenticated',
    userId: user._id,
    email: user.email,
    role: sessionRole,
  };
};

export const refreshMemberSession = async (input: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const payload = verifyRefreshToken(input.refreshToken);
  const stored = await findActiveRefreshToken({ userId: payload.sub, token: input.refreshToken });
  const user = stored ? await findAuthUserById(payload.sub) : null;

  if (!stored || !user || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(401, 'invalid_refresh_token', 'Refresh token is invalid.');
  }

  if (!user.emailVerifiedAt) {
    throw new ApiError(403, 'email_verification_required', 'Email verification is required.');
  }

  await revokeRefreshToken(input.refreshToken);
  const sessionRole = await restoreRoleIfSwitched(user);
  const tokens = await createMemberSession({
    userId: user._id,
    email: user.email,
    role: sessionRole,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    user: { id: user._id, email: user.email, role: sessionRole },
    tokens,
  };
};

export const verifyEmailOtpAndAuthenticate = async (input: {
  email: string;
  otp: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const user = await findAuthUserByEmail(input.email);
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(400, 'invalid_token', 'Verification code is invalid or expired.');
  }

  const record = await findEmailVerificationTokenForUser(user._id, input.otp);
  if (!record) {
    throw new ApiError(400, 'invalid_token', 'Verification code is invalid or expired.');
  }

  await useEmailVerificationToken(record.id);
  await updateAuthUserEmailVerifiedAt(user._id, new Date());

  const verifiedUser = await findAuthUserById(user._id);
  if (!verifiedUser || verifiedUser.status !== UserStatus.ACTIVE) {
    throw new ApiError(400, 'invalid_token', 'Verification code is invalid or expired.');
  }

  const sessionRole = await restoreRoleIfSwitched(verifiedUser);
  const tokens = await createMemberSession({
    userId: verifiedUser._id,
    email: verifiedUser.email,
    role: sessionRole,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    user: { id: verifiedUser._id, email: verifiedUser.email, role: sessionRole },
    tokens,
    message: 'Email verified successfully.',
  };
};

export const resendEmailVerificationOtp = async (email: string) => {
  const user = await findAuthUserByEmail(email);
  if (!user || user.emailVerifiedAt) {
    return {
      message: 'If the account exists and is unverified, a verification email was sent.',
    };
  }

  const verification = await issueEmailVerificationOtp({
    userId: user._id,
    email: user.email,
    displayName: user.profile.displayName ?? user.email,
  });

  return {
    message: 'Verification email sent.',
    expiresAt: verification.expiresAt.toISOString(),
    expiresInSeconds: verification.expiresInSeconds,
  };
};
