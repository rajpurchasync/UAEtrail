import { Router } from 'express';
import { getVapidPublicKey } from '../lib/push.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { composeUserMemberRoutes } from './user/composeUserMemberRoutes.js';
import { composeUserPublicRoutes } from './user/composeUserPublicRoutes.js';

export const userRouter = Router();

userRouter.get('/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  res.json({ data: { publicKey: key } });
});

composeUserPublicRoutes(userRouter);

userRouter.use(requireAuth, requireVerifiedEmail);

composeUserMemberRoutes(userRouter);
