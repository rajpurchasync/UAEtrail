import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { findAuthUserById } from '../lib/auth-users.js';

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
    const user = await findAuthUserById(payload.sub);

    if (user && user.status === 'ACTIVE') {
      req.auth = {
        userId: user._id,
        email: user.email,
        role: user.role
      };
    }
    next();
  } catch {
    next();
  }
};
