import { ApiError } from '../lib/api-error.js';
import { env } from '../config/env.js';
import { randomToken } from '../lib/hash.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import {
  createPasswordResetToken,
  revokeRefreshTokensByUser,
  consumePasswordResetToken,
} from './auth-session-commands.js';
import { findPasswordResetToken } from './auth-session-read.js';
import { findAuthUserByEmail, findAuthUserById } from './member-identity-read.js';
import { updateAuthUserPassword } from './member-identity-commands.js';

export const requestForgotPasswordReset = async (email: string) => {
  const user = await findAuthUserByEmail(email);
  if (!user) {
    return { message: 'If the account exists, a reset token was generated.', resetToken: undefined };
  }

  const token = randomToken(24);
  await createPasswordResetToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  scheduleSideEffect(
    sendPasswordResetEmail({
      to: user.email,
      name: user.profile.displayName ?? user.email,
      token,
    }),
    'auth.forgot_password_email'
  );

  return {
    message: 'If the account exists, a reset link was sent.',
    resetToken: env.NODE_ENV === 'production' ? undefined : token,
  };
};

export const resetPasswordWithToken = async (token: string, password: string) => {
  const record = await findPasswordResetToken(token);
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError(400, 'invalid_token', 'Reset token is invalid or expired.');
  }

  const newHash = await hashPassword(password);
  await updateAuthUserPassword(record.userId, newHash);
  await consumePasswordResetToken(record.id);
  await revokeRefreshTokensByUser(record.userId);

  return { message: 'Password updated successfully.' };
};

export const changeAuthenticatedPassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  otpToken?: string;
}) => {
  const user = await findAuthUserById(input.userId);
  if (!user?.passwordHash) {
    throw new ApiError(400, 'oauth_account', 'Google accounts cannot change password here.');
  }

  let otpRecordId: string | null = null;
  if (env.NODE_ENV === 'production') {
    if (!input.otpToken) {
      throw new ApiError(400, 'otp_required', 'OTP verification is required to change password.');
    }
    const otpRecord = await findPasswordResetToken(input.otpToken);
    if (
      !otpRecord ||
      otpRecord.userId !== user._id ||
      otpRecord.usedAt ||
      otpRecord.expiresAt < new Date()
    ) {
      throw new ApiError(400, 'invalid_token', 'OTP is invalid or expired.');
    }
    otpRecordId = otpRecord.id;
  }

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new ApiError(401, 'invalid_password', 'Current password is incorrect.');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await updateAuthUserPassword(user._id, passwordHash);
  if (otpRecordId) {
    await consumePasswordResetToken(otpRecordId);
  }
  await revokeRefreshTokensByUser(user._id);

  return { message: 'Password changed successfully.' };
};

export const requestAuthenticatedPasswordChangeOtp = async (userId: string) => {
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (!user.passwordHash) {
    throw new ApiError(400, 'oauth_account', 'Google accounts cannot change password here.');
  }

  const token = randomToken(24);
  await createPasswordResetToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  scheduleSideEffect(
    sendPasswordResetEmail({
      to: user.email,
      name: user.profile.displayName ?? user.email,
      token,
    }),
    'auth.forgot_password_email'
  );

  return {
    message: 'OTP sent to your email address.',
    otpToken: env.NODE_ENV === 'production' ? undefined : token,
  };
};
