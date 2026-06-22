import { NextFunction, Request, Response } from 'express';
import { UserStatus } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

/** Attach auth when a valid bearer token is present; otherwise continue anonymously. */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true }
    });

    if (user && user.status === UserStatus.ACTIVE) {
      req.auth = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
    }
    next();
  } catch {
    next();
  }
};
