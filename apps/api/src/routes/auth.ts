import { Request, Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { clearRefreshCookie } from '../lib/auth-cookies.js';
import {
  readRefreshToken,
  respondWithAuth,
  respondWithPendingVerification,
} from '../lib/auth-route-http.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { isDemoLoginAllowedForRequest } from '../lib/demo-login-policy.js';
import { loginWithDemoAccount } from '../services/auth-demo-commands.js';
import { authenticateWithGoogleIdToken } from '../services/auth-google-commands.js';
import {
  loginWithEmailPassword,
  refreshMemberSession,
  resendEmailVerificationOtp,
  verifyEmailOtpAndAuthenticate,
} from '../services/auth-login-commands.js';
import {
  changeAuthenticatedPassword,
  requestAuthenticatedPasswordChangeOtp,
  requestForgotPasswordReset,
  resetPasswordWithToken,
} from '../services/auth-password-commands.js';
import { registerWithEmailPassword } from '../services/auth-registration-commands.js';
import { createMemberSession } from '../services/auth-session-flow.js';
import { revokeRefreshToken } from '../services/auth-session-commands.js';
import { formatDisplayNameFromParts, personNameFieldsSchema } from '../domain/person-name.js';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    givenName: personNameFieldsSchema.shape.givenName,
    surname: personNameFieldsSchema.shape.surname,
    accountType: z.enum(['participant', 'company', 'guide']).default('participant'),
    organizationName: z.string().min(2).max(120).optional(),
    referralCode: z.string().min(4).max(12).optional(),
    groupInviteToken: z.string().min(20).optional(),
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const demoLoginSchema = z.object({
  email: z.string().email(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
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
    .regex(/[0-9]/, 'Must include at least one number'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: resetSchema.shape.password,
  otpToken: z.string().min(20).optional(),
});

const resendVerificationSchema = z.object({ email: z.string().email() });
const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  referralCode: z.string().min(4).max(12).optional(),
  groupInviteToken: z.string().min(20).optional(),
});

const isDemoLoginAllowed = (req: Request): boolean =>
  isDemoLoginAllowedForRequest(
    env.NODE_ENV,
    req.socket?.remoteAddress,
    process.env.ALLOW_DEMO_LOGIN,
    env.RUN_ENV ?? process.env.RUN_ENV
  );

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof registerSchema>;
    const displayName = formatDisplayNameFromParts(body.givenName, body.surname);
    const result = await registerWithEmailPassword({
      email: body.email,
      password: body.password,
      displayName,
      givenName: body.givenName,
      surname: body.surname,
      accountType: body.accountType,
      organizationName: body.organizationName,
      referralCode: body.referralCode,
      groupInviteToken: body.groupInviteToken,
    });

    respondWithPendingVerification(res, result.httpStatus, {
      email: result.email,
      expiresAt: result.expiresAt,
      expiresInSeconds: result.expiresInSeconds,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const outcome = await loginWithEmailPassword({
      email,
      password,
      demoLoginAllowed: isDemoLoginAllowed(req),
    });

    if (outcome.kind === 'pending_verification') {
      respondWithPendingVerification(res, 200, {
        email: outcome.email,
        expiresAt: outcome.expiresAt,
        expiresInSeconds: outcome.expiresInSeconds,
        message: outcome.message,
      });
      return;
    }

    const tokens = await createMemberSession({
      userId: outcome.userId,
      email: outcome.email,
      role: outcome.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    respondWithAuth(res, 200, { id: outcome.userId, email: outcome.email, role: outcome.role }, tokens, {
      emailVerified: true,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/demo-login', validate({ body: demoLoginSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof demoLoginSchema>;
    const result = await loginWithDemoAccount({
      email,
      demoLoginAllowed: isDemoLoginAllowed(req),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    respondWithAuth(res, 200, result.user, result.tokens, {
      emailVerified: result.emailVerified,
      authProvider: result.authProvider,
      demoLogin: true,
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

    try {
      const { user, tokens } = await refreshMemberSession({
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      respondWithAuth(res, 200, user, tokens);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'email_verification_required') {
        clearRefreshCookie(res);
      }
      throw error;
    }
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
    const result = await verifyEmailOtpAndAuthenticate({
      email,
      otp,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    respondWithAuth(res, 200, result.user, result.tokens, {
      message: result.message,
      emailVerified: true,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', validate({ body: forgotSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const result = await requestForgotPasswordReset(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', validate({ body: resetSchema }), async (req, res, next) => {
  try {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const result = await resetPasswordWithToken(token, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/resend-verification', validate({ body: resendVerificationSchema }), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof resendVerificationSchema>;
    const result = await resendEmailVerificationOtp(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/google', validate({ body: googleAuthSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof googleAuthSchema>;
    const result = await authenticateWithGoogleIdToken({
      idToken: body.idToken,
      referralCode: body.referralCode,
      groupInviteToken: body.groupInviteToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    respondWithAuth(res, result.httpStatus, result.user, result.tokens, {
      isNewUser: result.isNewUser,
      emailVerified: true,
      authProvider: 'google',
    });
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/change-password', requireAuth, validate({ body: changePasswordSchema }), async (req, res, next) => {
  try {
    const { currentPassword, newPassword, otpToken } = req.body as z.infer<typeof changePasswordSchema>;
    const result = await changeAuthenticatedPassword({
      userId: req.auth!.userId,
      currentPassword,
      newPassword,
      otpToken,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/change-password/request-otp', requireAuth, async (req, res, next) => {
  try {
    const result = await requestAuthenticatedPasswordChangeOtp(req.auth!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
