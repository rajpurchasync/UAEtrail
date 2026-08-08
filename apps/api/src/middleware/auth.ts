import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { touchLastActive } from '../lib/user-activity.js';
import { validateSseTicket } from '../lib/sse-ticket.js';
import { ApiError } from '../lib/api-error.js';

const authenticateBearer = async (token: string) => {
  try {
    const payload = verifyAccessToken(token);
    const user = await findAuthUserById(payload.sub);

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'unauthorized', 'User is not active.');
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'unauthorized', 'Session expired. Please sign in again.');
  }
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'unauthorized', 'Missing bearer token.');
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateBearer(token);

    req.auth = {
      userId: user._id,
      email: user.email,
      role: user.role
    };
    void touchLastActive(user._id);
    next();
  } catch (error) {
    next(error);
  }
};

/** SSE clients use a short-lived ticket (see POST /chat/stream-ticket). */
export const requireSseTicket = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ticket = typeof req.query.ticket === 'string' ? req.query.ticket : undefined;
    if (!ticket) {
      throw new ApiError(401, 'unauthorized', 'Missing stream ticket.');
    }

    const userId = await validateSseTicket(ticket);
    if (!userId) {
      throw new ApiError(401, 'unauthorized', 'Stream ticket is invalid or expired.');
    }

    const user = await findAuthUserById(userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new ApiError(401, 'unauthorized', 'User is not active.');
    }

    req.auth = {
      userId: user._id,
      email: user.email,
      role: user.role
    };
    void touchLastActive(user._id);
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
    const user = await findAuthUserById(req.auth.userId);
    if (!user?.emailVerifiedAt) {
      throw new ApiError(403, 'email_verification_required', 'Email verification is required.');
    }
    next();
  } catch (error) {
    next(error);
  }
};
