import { Router } from 'express';
import { getVapidPublicKey } from '../lib/push.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { registerAccountLifecycleRoutes } from './user/registerAccountLifecycleRoutes.js';
import { registerBuddyRoutes } from './user/registerBuddyRoutes.js';
import { registerGroupRoutes } from './user/registerGroupRoutes.js';
import { registerHostApplicationRoutes } from './user/registerHostApplicationRoutes.js';
import {
  registerMeAccountSessionRoutes,
  registerMeActivityParticipationRoutes,
} from './user/registerMeEngagementRoutes.js';
import { registerMeRewardsRoutes } from './user/registerMeRewardsRoutes.js';
import { registerMeSubmittedPlaceRoutes } from './user/registerMeSubmittedPlaceRoutes.js';
import { registerNotificationRoutes } from './user/registerNotificationRoutes.js';
import { registerProfileRoutes } from './user/registerProfileRoutes.js';
import { registerPublicActivityRoutes } from './user/registerPublicActivityRoutes.js';
import { registerPublicMemberRoutes } from './user/registerPublicMemberRoutes.js';
import { registerPublicPlaceRoutes } from './user/registerPublicPlaceRoutes.js';
import { registerPublicRewardsRoutes } from './user/registerPublicRewardsRoutes.js';
import { registerPublicTenantRoutes } from './user/registerPublicTenantRoutes.js';

export const userRouter = Router();

userRouter.get('/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  res.json({ data: { publicKey: key } });
});

registerPublicPlaceRoutes(userRouter);
registerPublicTenantRoutes(userRouter);
registerPublicActivityRoutes(userRouter);
registerAccountLifecycleRoutes(userRouter);
registerPublicRewardsRoutes(userRouter);
registerPublicMemberRoutes(userRouter);

userRouter.use(requireAuth, requireVerifiedEmail);

registerMeActivityParticipationRoutes(userRouter);

registerProfileRoutes(userRouter);
registerNotificationRoutes(userRouter);
registerBuddyRoutes(userRouter);
registerGroupRoutes(userRouter);
registerHostApplicationRoutes(userRouter);

registerMeAccountSessionRoutes(userRouter);
registerMeSubmittedPlaceRoutes(userRouter);
registerMeRewardsRoutes(userRouter);
