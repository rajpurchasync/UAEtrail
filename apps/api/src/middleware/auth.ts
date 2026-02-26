import { NextFunction, Request, Response } from 'express';
import { UserStatus } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.js';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'unauthorized', 'Missing bearer token.');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ApiError(401, 'unauthorized', 'User is not active.');
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireVerifiedEmail = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.auth) {
      throw new ApiError(401, 'unauthorized', 'Authentication is required.');
    }
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { emailVerifiedAt: true }
    });
    if (!user?.emailVerifiedAt) {
      throw new ApiError(403, 'email_verification_required', 'Email verification is required.');
    }
    next();
  } catch (error) {
    next(error);
  }
};
