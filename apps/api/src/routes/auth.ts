import { AuthProvider, UserRole, UserStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../lib/auth-cookies.js';
import { hashToken, randomToken, sha256 } from '../lib/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { toSharedRole } from '../lib/mappers.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/slug.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail, sendVerificationEmail, isEmailConfigured } from '../lib/email.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { processSignupRewards } from '../services/rewards.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number'),
  displayName: z.string().min(2).max(80),
  accountType: z.enum(['visitor', 'company', 'guide']).default('visitor'),
  organizationName: z.string().min(2).max(120).optional(),
  referralCode: z.string().min(4).max(12).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const tokenSchema = z.object({ token: z.string().min(20) });
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
  newPassword: resetSchema.shape.password
});

const resendVerificationSchema = z.object({ email: z.string().email() });
const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  referralCode: z.string().min(4).max(12).optional()
});

const mapAccountTypeToTenantType = (accountType: 'company' | 'guide'): 'COMPANY' | 'GUIDE_OWNED' =>
  accountType === 'company' ? 'COMPANY' : 'GUIDE_OWNED';

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

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(refreshToken),
      expiresAt,
      ipAddress,
      userAgent
    }
  });

  return { accessToken, refreshToken };
};

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const { email, password, displayName, accountType, organizationName, referralCode } = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'email_taken', 'Email is already registered.');
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = randomToken(24);
    const userReferralCode = await createUniqueReferralCode();

    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        referralCode: userReferralCode,
        role: UserRole.VISITOR,
        profile: {
          create: {
            displayName
          }
        },
        emailVerification: {
          create: {
            token: hashToken(verificationToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        },
        organizerApplications:
          accountType === 'visitor'
            ? undefined
            : {
                create: {
                  requestedName: organizationName ?? `${displayName} Adventures`,
                  requestedSlug: slugify(organizationName ?? `${displayName}-adventures`),
                  requestedType: mapAccountTypeToTenantType(accountType)
                }
              }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    void processSignupRewards(prisma, created.id, referralCode).catch(() => undefined);

    const tokens = await createSession({
      userId: created.id,
      email: created.email,
      role: created.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    void sendVerificationEmail({
      to: created.email,
      name: displayName,
      token: verificationToken
    }).catch(() => undefined);

    respondWithAuth(res, 201, created, tokens, {
      requiresEmailVerification: true,
      verificationToken:
        env.NODE_ENV === 'production' && isEmailConfigured() ? undefined : verificationToken
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true, emailVerifiedAt: true, status: true }
    });
    if (!user?.passwordHash) {
      throw new ApiError(401, 'oauth_account', 'This account uses Google sign-in.');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, 'account_suspended', 'Account is suspended.');
    }

    const tokens = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, user, tokens, {
      emailVerified: Boolean(user.emailVerifiedAt)
    });
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
    const tokenHash = sha256(refreshToken);

    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!stored || stored.user.status !== UserStatus.ACTIVE) {
      throw new ApiError(401, 'invalid_refresh_token', 'Refresh token is invalid.');
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    const tokens = await createSession({
      userId: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    respondWithAuth(res, 200, stored.user, tokens);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', validate({ body: refreshBodySchema }), async (req, res, next) => {
  try {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: sha256(refreshToken),
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-email', validate({ body: tokenSchema }), async (req, res, next) => {
  try {
    const { token } = req.body as z.infer<typeof tokenSchema>;
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token: hashToken(token) },
      include: { user: true }
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, 'invalid_token', 'Verification token is invalid or expired.');
    }

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() }
      })
    ]);

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', validate({ body: forgotSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ message: 'If the account exists, a reset token was generated.' });
      return;
    }

    const token = randomToken(24);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    void sendPasswordResetEmail({
      to: user.email,
      name: profile?.displayName ?? user.email,
      token
    }).catch(() => undefined);

    res.json({
      message: 'If the account exists, a reset link was sent.',
      resetToken: env.NODE_ENV === 'production' && isEmailConfigured() ? undefined : token
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', validate({ body: resetSchema }), async (req, res, next) => {
  try {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const record = await prisma.passwordResetToken.findUnique({ where: { token: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, 'invalid_token', 'Reset token is invalid or expired.');
    }

    const newHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/resend-verification', validate({ body: resendVerificationSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof resendVerificationSchema>;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || user.emailVerifiedAt) {
      res.json({ message: 'If the account exists and is unverified, a verification email was sent.' });
      return;
    }

    const verificationToken = randomToken(24);
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: hashToken(verificationToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    void sendVerificationEmail({
      to: user.email,
      name: user.profile?.displayName ?? user.email,
      token: verificationToken
    }).catch(() => undefined);

    res.json({
      message: 'Verification email sent.',
      verificationToken:
        env.NODE_ENV === 'production' && isEmailConfigured() ? undefined : verificationToken
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/google', validate({ body: googleAuthSchema }), async (req, res, next) => {
  try {
    const { idToken, referralCode } = req.body as z.infer<typeof googleAuthSchema>;
    const profile = await verifyGoogleIdToken(idToken);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        googleId: true,
        emailVerifiedAt: true,
        authProvider: true,
        passwordHash: true
      }
    });

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

      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: existing.googleId ?? profile.googleId,
          authProvider: AuthProvider.GOOGLE,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          lastActiveAt: new Date()
        },
        select: { id: true, email: true, role: true, status: true }
      });

      await prisma.profile.upsert({
        where: { userId: existing.id },
        update: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? undefined
        },
        create: {
          userId: existing.id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? undefined
        }
      });
    } else {
      isNewUser = true;
      const userReferralCode = await createUniqueReferralCode();
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          referralCode: userReferralCode,
          authProvider: AuthProvider.GOOGLE,
          role: UserRole.VISITOR,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          lastActiveAt: new Date(),
          profile: {
            create: {
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl ?? undefined
            }
          }
        },
        select: { id: true, email: true, role: true, status: true }
      });

      void processSignupRewards(prisma, user.id, referralCode).catch(() => undefined);
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
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user?.passwordHash) {
      throw new ApiError(400, 'oauth_account', 'Google accounts cannot change password here.');
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new ApiError(401, 'invalid_password', 'Current password is incorrect.');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});
