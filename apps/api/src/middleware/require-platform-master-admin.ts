import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/api-error.js';
import { assertPlatformMasterAdmin } from '../lib/platform-master-admin.js';

/** After `requireAuth` + platform admin role — restricts to master admin only. */
export const requirePlatformMasterAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return next(new ApiError(401, 'unauthorized', 'Authentication is required.'));
    }
    await assertPlatformMasterAdmin(userId);
    next();
  } catch (error) {
    next(error);
  }
};
