import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/api-error.js';

export const requireRole =
  (allowed: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new ApiError(401, 'unauthorized', 'Authentication is required.'));
    }
    if (!allowed.includes(req.auth.role)) {
      return next(new ApiError(403, 'forbidden', 'You are not allowed to perform this action.'));
    }
    return next();
  };
