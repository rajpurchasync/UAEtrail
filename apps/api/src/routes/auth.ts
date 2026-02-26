import { UserRole, UserStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { randomToken, sha256 } from '../lib/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { toSharedRole } from '../lib/mappers.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/slug.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

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
  organizationName: z.string().min(2).max(120).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const tokenSchema = z.object({ token: z.string().min(20) });
const refreshSchema = z.object({ refreshToken: z.string().min(20) });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});

const mapAccountTypeToTenantType = (accountType: 'company' | 'guide'): 'COMPANY' | 'GUIDE_OWNED' =>
  accountType === 'company' ? 'COMPANY' : 'GUIDE_OWNED';

const buildAuthResponse = (user: { id: string; email: string; role: UserRole }, tokens: { accessToken: string; refreshToken: string }) => ({
  user: {
    id: user.id,
    email: user.email,
    role: toSharedRole(user.role)
  },
  tokens
});

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
    const { email, password, displayName, accountType, organizationName } = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'email_taken', 'Email is already registered.');
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = randomToken(24);

    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.VISITOR,
        profile: {
          create: {
            displayName
          }
        },
        emailVerification: {
          create: {
            token: verificationToken,
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

    const tokens = await createSession({
      userId: created.id,
      email: created.email,
      role: created.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      ...buildAuthResponse(created, tokens),
      requiresEmailVerification: true,
      verificationToken: env.NODE_ENV === 'production' ? undefined : verificationToken
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
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
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

    res.json({
      ...buildAuthResponse(user, tokens),
      emailVerified: Boolean(user.emailVerifiedAt)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', validate({ body: refreshSchema }), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
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

    res.json(buildAuthResponse(stored.user, tokens));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', validate({ body: refreshSchema }), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: sha256(refreshToken),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-email', validate({ body: tokenSchema }), async (req, res, next) => {
  try {
    const { token } = req.body as z.infer<typeof tokenSchema>;
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
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
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    res.json({
      message: 'Password reset token generated.',
      resetToken: env.NODE_ENV === 'production' ? undefined : token
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', validate({ body: resetSchema }), async (req, res, next) => {
  try {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
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
      })
    ]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});
