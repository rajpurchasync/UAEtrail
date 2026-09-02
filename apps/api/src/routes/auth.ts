import { AuthProvider, UserRole, UserStatus } from '../domain/enums.js';
import { Request, Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../lib/auth-cookies.js';
import { randomToken, generateEmailOtp } from '../lib/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { toSharedRole } from '../lib/mappers.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { slugify } from '../lib/slug.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import {
  EMAIL_VERIFICATION_OTP_TTL_MS,
  EMAIL_VERIFICATION_OTP_TTL_SECONDS
} from '../lib/auth-constants.js';
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createRefreshToken,
  findActiveRefreshToken,
  findEmailVerificationTokenForUser,
  findPasswordResetToken,
  revokeRefreshToken,
  revokeRefreshTokensByUser,
  useEmailVerificationToken,
  usePasswordResetToken
} from '../lib/auth-tokens.js';
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserById,
  findAuthUserByGoogleId,
  updateAuthUserEmailVerifiedAt,
  updateAuthUserGoogleLink,
  updateAuthUserPassword,
  updateAuthUserProfile,
  updateAuthUserLastActive,
  updateAuthUserCore
} from '../lib/auth-users.js';
import { createHostApplicationRecord } from '../lib/host-applications-store.js';
import { processSignupRewardsDefault } from '../services/rewards.js';
import { acceptGroupInviteByToken, acceptPendingGroupInvitesForEmail } from '../lib/social-groups-store.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number'),
  displayName: z.string().min(2).max(80),
  accountType: z.enum(['participant', 'company', 'guide']).default('participant'),
  organizationName: z.string().min(2).max(120).optional(),
  referralCode: z.string().min(4).max(12).optional(),
  groupInviteToken: z.string().min(20).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const demoLoginSchema = z.object({
  email: z.string().email()
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code.')
});
const refreshBodySchema = z.object({ refreshToken: z.string().min(20).optional() });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(20),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: resetSchema.shape.password,
  otpToken: z.string().min(20).optional()
});

const resendVerificationSchema = z.object({ email: z.string().email() });
const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  referralCode: z.string().min(4).max(12).optional(),
  groupInviteToken: z.string().min(20).optional()
});

const mapAccountTypeToTenantType = (accountType: 'company' | 'guide'): 'COMPANY' | 'GUIDE_OWNED' =>
  accountType === 'company' ? 'COMPANY' : 'GUIDE_OWNED';

const issueEmailVerificationOtp = async (input: {
  userId: string;
  email: string;
  displayName: string;
}) => {
  const otp = generateEmailOtp();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_OTP_TTL_MS);

  await createEmailVerificationToken({
    userId: input.userId,
    token: otp,
    expiresAt
  });

  try {
    const sent = await sendVerificationEmail({
      to: input.email,
      name: input.displayName,
      otp
    });
    if (!sent) {
      throw new Error('Email transport is not configured.');
    }
  } catch (error) {
    console.error('[auth] Failed to send verification email', {
      email: input.email,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new ApiError(503, 'email_delivery_failed', 'Could not send verification email. Please try again.');
  }

  return {
    otp,
    expiresAt,
    expiresInSeconds: EMAIL_VERIFICATION_OTP_TTL_SECONDS
  };
};

const demoAccountEmails = new Set([
  'admin@uaetrails.app',
  'organizer@uaetrails.app',
  'guide@uaetrails.app',
  'visitor@uaetrails.app',
  'vendor@uaetrails.app'
]);

const demoAccountDefaults: Record<string, { password: string; role: UserRole; displayName: string }> = {
  'admin@uaetrails.app': {
    password: 'Admin@12345',
    role: UserRole.PLATFORM_ADMIN,
    displayName: 'UAE Trails Admin'
  },
  'organizer@uaetrails.app': {
    password: 'Organizer@12345',
    role: UserRole.TENANT_OWNER,
    displayName: 'Adventure Organizer'
  },
  'guide@uaetrails.app': {
    password: 'Guide@12345',
    role: UserRole.TENANT_GUIDE,
    displayName: 'Trail Guide'
  },
  'visitor@uaetrails.app': {
    password: 'Visitor@12345',
    role: UserRole.PARTICIPANT,
    displayName: 'Visitor User'
  },
  'vendor@uaetrails.app': {
    password: 'Vendor@12345',
    role: UserRole.MERCHANT_ADMIN,
    displayName: 'Vendor Admin'
  }
};

const isDemoLoginAllowed = (req: Request): boolean => env.NODE_ENV === 'test' || isLocalRequest(req);

const isLocalHost = (value: string): boolean => {
  const host = value.split(',')[0]?.trim() ?? '';
  if (!host) return false;
  const normalized = host.split(':')[0]?.toLowerCase() ?? '';
  return normalized === 'localhost' || normalized === '127.0.0.1';
};

const isLocalRequest = (req: Request): boolean => {
  const forwardedHost = req.headers['x-forwarded-host'];
  if (typeof forwardedHost === 'string' && isLocalHost(forwardedHost)) {
    return true;
  }
  const host = req.headers.host;
  if (typeof host === 'string' && isLocalHost(host)) {
    return true;
  }
  return isLocalHost(req.hostname ?? '');
};

const buildAuthResponse = (user: { id: string; email: string; role: UserRole }, tokens: { accessToken: string }) => ({
  user: {
    id: user.id,
    email: user.email,
    role: toSharedRole(user.role)
  },
  tokens: { accessToken: tokens.accessToken }
});

const readRefreshToken = (req: { cookies?: Record<string, string>; body?: { refreshToken?: string } }): string | null => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.length >= 20) {
    return fromCookie;
  }
  if (env.NODE_ENV === 'production') {
    return null;
  }
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody.length >= 20) {
    return fromBody;
  }
  return null;
};

const respondWithAuth = (
  res: import('express').Response,
  status: number,
  user: { id: string; email: string; role: UserRole },
  tokens: { accessToken: string; refreshToken: string },
  extra: Record<string, unknown> = {}
): void => {
  setRefreshCookie(res, tokens.refreshToken);
  res.status(status).json({ ...buildAuthResponse(user, tokens), ...extra });
};

const respondWithPendingVerification = (
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
    expiresInSeconds: input.expiresInSeconds
  });
};

// Role switch is session-only: restore the original role at every new login/refresh.
const restoreRoleIfSwitched = async (user: { _id: string; role: UserRole; profile?: { switchedFromRole?: UserRole | null } }): Promise<UserRole> => {
  const original = user.profile?.switchedFromRole;
  if (!original) return user.role;
  await updateAuthUserCore({ userId: user._id, role: original, profile: { switchedFromRole: null } });
  return original;
};

const createSession = async ({
  userId,
  email,
  role,
  ipAddress,
  userAgent
}: {
  userId: string;
  email: string;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const accessToken = signAccessToken({ sub: userId, email, role: toSharedRole(role) });
  const refreshToken = signRefreshToken({ sub: userId, email });
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await createRefreshToken({ userId, token: refreshToken, expiresAt, ipAddress, userAgent });

  return { accessToken, refreshToken };
};

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const { email, password, displayName, accountType, organizationName, referralCode, groupInviteToken } = req.body as z.infer<typeof registerSchema>;
    const existing = await findAuthUserByEmail(email);

    if (existing?.emailVerifiedAt) {
      throw new ApiError(409, 'email_taken', 'Email is already registered.');
    }

    if (existing && !existing.emailVerifiedAt) {
      if (!existing.passwordHash || !(await verifyPassword(password, existing.passwordHash))) {
        throw new ApiError(
          409,
          'email_pending_verification',
          'This email has a pending account. Sign in with your password to finish verification.'
        );
      }

      await updateAuthUserProfile(existing._id, { displayName });
      const verification = await issueEmailVerificationOtp({
        userId: existing._id,
        email: existing.email,
        displayName
      });

      respondWithPendingVerification(res, 200, {
        email: existing.email,
        expiresAt: verification.expiresAt,
        expiresInSeconds: verification.expiresInSeconds,
        message: 'Verification code resent. Enter the code to finish creating your account.'
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userReferralCode = await createUniqueReferralCode();

    const created = await createAuthUser({
      email,
      passwordHash,
      googleId: null,
      authProvider: 'EMAIL',
      role: 'PARTICIPANT',
      status: 'ACTIVE',
      emailVerifiedAt: null,
      lastActiveAt: null,
      referralCode: userReferralCode,
      profile: { displayName, phone: null, bio: null, avatarUrl: null }
    });

    if (accountType !== 'participant') {
      await createHostApplicationRecord({
        applicantId: created._id,
        requestedName: organizationName ?? `${displayName} Adventures`,
        requestedSlug: slugify(organizationName ?? `${displayName}-adventures`),
        requestedType: mapAccountTypeToTenantType(accountType)
      });
    }

    const verification = await issueEmailVerificationOtp({
      userId: created._id,
      email: created.email,
      displayName
    });

    void processSignupRewardsDefault(created._id, referralCode).catch(() => undefined);
    if (groupInviteToken) {
      void acceptGroupInviteByToken({ token: groupInviteToken, userId: created._id, email: created.email }).catch(
        () => undefined
      );
    } else {
      void acceptPendingGroupInvitesForEmail({ userId: created._id, email: created.email }).catch(() => undefined);
    }

    respondWithPendingVerification(res, 201, {
      email: created.email,
      expiresAt: verification.expiresAt,
      expiresInSeconds: verification.expiresInSeconds,
      message: 'Account created. Verify your email to finish registration.'
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const normalizedEmail = email.trim().toLowerCase();

    if (demoAccountEmails.has(normalizedEmail) && !isDemoLoginAllowed(req)) {
      throw new ApiError(403, 'demo_account_restricted', 'Demo accounts are available only on localhost or test environments.');
    }

    const user = await findAuthUserByEmail(email);
    if (!user?.passwordHash) {
      throw new ApiError(401, 'oauth_account', 'This account uses Google sign-in.');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, 'account_suspended', 'Account is suspended.');
    }

    if (!user.emailVerifiedAt) {
      const verification = await issueEmailVerificationOtp({
        userId: user._id,
        email: user.email,
        displayName: user.profile.displayName ?? user.email
      });

      respondWithPendingVerification(res, 200, {
        email: user.email,
        expiresAt: verification.expiresAt,
        expiresInSeconds: verification.expiresInSeconds,
        message: 'Verify your email to finish registration.'
      });
      return;
    }

    const sessionRole = await restoreRoleIfSwitched(user);
    const tokens = await createSession({
      userId: user._id,
      email: user.email,
      role: sessionRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, { id: user._id, email: user.email, role: sessionRole }, tokens, {
      emailVerified: true
    });

    await updateAuthUserLastActive(user._id);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/demo-login', validate({ body: demoLoginSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof demoLoginSchema>;
    const normalizedEmail = email.trim().toLowerCase();

    if (!demoAccountEmails.has(normalizedEmail)) {
      throw new ApiError(404, 'demo_account_not_found', 'Demo account is not available.');
    }

    if (!isDemoLoginAllowed(req)) {
      throw new ApiError(403, 'demo_account_restricted', 'Demo accounts are available only on localhost or test environments.');
    }

    let user = await findAuthUserByEmail(normalizedEmail);
    if (!user) {
      const defaults = demoAccountDefaults[normalizedEmail];
      if (!defaults) {
        throw new ApiError(404, 'demo_account_not_found', 'Demo account is not available.');
      }

      const passwordHash = await hashPassword(defaults.password);
      const referralCode = await createUniqueReferralCode();
      user = await createAuthUser({
        email: normalizedEmail,
        passwordHash,
        googleId: null,
        authProvider: 'EMAIL',
        role: defaults.role,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        lastActiveAt: new Date(),
        referralCode,
        profile: {
          displayName: defaults.displayName,
          phone: null,
          bio: null,
          avatarUrl: null
        }
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, 'account_suspended', 'Account is suspended.');
    }

    // Demo accounts always use their canonical role — ignore any stale visitor-switch state
    const defaults = demoAccountDefaults[normalizedEmail];
    const canonicalRole = defaults?.role ?? user.role;
    if (user.role !== canonicalRole || user.profile?.switchedFromRole) {
      await updateAuthUserCore({ userId: user._id, role: canonicalRole, profile: { switchedFromRole: null } });
    }

    const tokens = await createSession({
      userId: user._id,
      email: user.email,
      role: canonicalRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, { id: user._id, email: user.email, role: canonicalRole }, tokens, {
      emailVerified: Boolean(user.emailVerifiedAt),
      authProvider: user.authProvider.toLowerCase(),
      demoLogin: true
    });

    await updateAuthUserLastActive(user._id);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', validate({ body: refreshBodySchema }), async (req, res, next) => {
  try {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      throw new ApiError(401, 'invalid_refresh_token', 'Refresh token is missing.');
    }
    const payload = verifyRefreshToken(refreshToken);

    const stored = await findActiveRefreshToken({ userId: payload.sub, token: refreshToken });
    const user = stored ? await findAuthUserById(payload.sub) : null;

    if (!stored || !user || user.status !== UserStatus.ACTIVE) {
      throw new ApiError(401, 'invalid_refresh_token', 'Refresh token is invalid.');
    }

    if (!user.emailVerifiedAt) {
      clearRefreshCookie(res);
      throw new ApiError(403, 'email_verification_required', 'Email verification is required.');
    }

    await revokeRefreshToken(refreshToken);

    const sessionRole = await restoreRoleIfSwitched(user);
    const tokens = await createSession({
      userId: user._id,
      email: user.email,
      role: sessionRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, { id: user._id, email: user.email, role: sessionRole }, tokens);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', validate({ body: refreshBodySchema }), async (req, res, next) => {
  try {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-email', validate({ body: verifyEmailSchema }), async (req, res, next) => {
  try {
    const { email, otp } = req.body as z.infer<typeof verifyEmailSchema>;
    const user = await findAuthUserByEmail(email);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ApiError(400, 'invalid_token', 'Verification code is invalid or expired.');
    }

    const record = await findEmailVerificationTokenForUser(user._id, otp);
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
    const tokens = await createSession({
      userId: verifiedUser._id,
      email: verifiedUser.email,
      role: sessionRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, { id: verifiedUser._id, email: verifiedUser.email, role: sessionRole }, tokens, {
      message: 'Email verified successfully.',
      emailVerified: true
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', validate({ body: forgotSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await findAuthUserByEmail(email);
    if (!user) {
      res.json({ message: 'If the account exists, a reset token was generated.' });
      return;
    }

    const token = randomToken(24);
    await createPasswordResetToken({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    void sendPasswordResetEmail({
      to: user.email,
      name: user.profile.displayName ?? user.email,
      token
    }).catch(() => undefined);

    res.json({
      message: 'If the account exists, a reset link was sent.',
      resetToken: env.NODE_ENV === 'production' ? undefined : token
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', validate({ body: resetSchema }), async (req, res, next) => {
  try {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const record = await findPasswordResetToken(token);
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, 'invalid_token', 'Reset token is invalid or expired.');
    }

    const newHash = await hashPassword(password);
    await updateAuthUserPassword(record.userId, newHash);
    await usePasswordResetToken(record.id);
    await revokeRefreshTokensByUser(record.userId);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/resend-verification', validate({ body: resendVerificationSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof resendVerificationSchema>;
    const user = await findAuthUserByEmail(email);

    if (!user || user.emailVerifiedAt) {
      res.json({ message: 'If the account exists and is unverified, a verification email was sent.' });
      return;
    }

    const verification = await issueEmailVerificationOtp({
      userId: user._id,
      email: user.email,
      displayName: user.profile.displayName ?? user.email
    });

    res.json({
      message: 'Verification email sent.',
      expiresAt: verification.expiresAt.toISOString(),
      expiresInSeconds: verification.expiresInSeconds
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/google', validate({ body: googleAuthSchema }), async (req, res, next) => {
  try {
    const { idToken, referralCode, groupInviteToken } = req.body as z.infer<typeof googleAuthSchema>;
    const profile = await verifyGoogleIdToken(idToken);

    const existingByGoogle = await findAuthUserByGoogleId(profile.googleId);
    const existingByEmail = existingByGoogle ? existingByGoogle : await findAuthUserByEmail(profile.email);
    const existing = existingByEmail;

    let user: { id: string; email: string; role: UserRole; status: UserStatus };
    let isNewUser = false;

    if (existing) {
      if (existing.status !== UserStatus.ACTIVE) {
        throw new ApiError(403, 'account_suspended', 'Account is suspended.');
      }

      if (
        !existing.googleId &&
        existing.authProvider === AuthProvider.EMAIL &&
        existing.passwordHash
      ) {
        throw new ApiError(
          409,
          'account_exists_use_password',
          'An account with this email already exists. Sign in with your password first.'
        );
      }

      const restoredRole = await restoreRoleIfSwitched(existing);
      user = { id: existing._id, email: existing.email, role: restoredRole, status: existing.status };

      await updateAuthUserGoogleLink({
        userId: existing._id,
        googleId: profile.googleId,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        lastActiveAt: new Date(),
        profile: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? undefined,
          phone: null,
          bio: null
        }
      });
    } else {
      isNewUser = true;
      const userReferralCode = await createUniqueReferralCode();
      const created = await createAuthUser({
        email: profile.email,
        passwordHash: null,
        googleId: profile.googleId,
        authProvider: 'GOOGLE',
        role: 'PARTICIPANT',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        lastActiveAt: new Date(),
        referralCode: userReferralCode,
        profile: {
          displayName: profile.displayName,
          phone: null,
          bio: null,
          avatarUrl: profile.avatarUrl ?? null
        }
      });

      user = { id: created._id, email: created.email, role: created.role, status: created.status };

      void processSignupRewardsDefault(created._id, referralCode).catch(() => undefined);
      if (groupInviteToken) {
        void acceptGroupInviteByToken({ token: groupInviteToken, userId: created._id, email: created.email }).catch(
          () => undefined
        );
      } else {
        void acceptPendingGroupInvitesForEmail({ userId: created._id, email: created.email }).catch(() => undefined);
      }
    }

    const tokens = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, isNewUser ? 201 : 200, user, tokens, {
      isNewUser,
      emailVerified: true,
      authProvider: 'google'
    });
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/change-password', requireAuth, validate({ body: changePasswordSchema }), async (req, res, next) => {
  try {
    const { currentPassword, newPassword, otpToken } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await findAuthUserById(req.auth!.userId);
    if (!user?.passwordHash) {
      throw new ApiError(400, 'oauth_account', 'Google accounts cannot change password here.');
    }

    let otpRecordId: string | null = null;
    if (env.NODE_ENV === 'production') {
      if (!otpToken) {
        throw new ApiError(400, 'otp_required', 'OTP verification is required to change password.');
      }
      const otpRecord = await findPasswordResetToken(otpToken);
      if (!otpRecord || otpRecord.userId !== user._id || otpRecord.usedAt || otpRecord.expiresAt < new Date()) {
        throw new ApiError(400, 'invalid_token', 'OTP is invalid or expired.');
      }
      otpRecordId = otpRecord.id;
    }

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new ApiError(401, 'invalid_password', 'Current password is incorrect.');
    }

    const passwordHash = await hashPassword(newPassword);
    await updateAuthUserPassword(user._id, passwordHash);
    if (otpRecordId) {
      await usePasswordResetToken(otpRecordId);
    }
    await revokeRefreshTokensByUser(user._id);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/change-password/request-otp', requireAuth, async (req, res, next) => {
  try {
    const user = await findAuthUserById(req.auth!.userId);
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
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    void sendPasswordResetEmail({
      to: user.email,
      name: user.profile.displayName ?? user.email,
      token
    }).catch(() => undefined);

    res.json({
      message: 'OTP sent to your email address.',
      otpToken: env.NODE_ENV === 'production' ? undefined : token
    });
  } catch (error) {
    next(error);
  }
});
