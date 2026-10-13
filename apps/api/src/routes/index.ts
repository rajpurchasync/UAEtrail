import { Router } from 'express';
import { authLimiter } from '../middleware/rate-limit-instances.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { mediaRouter } from './media.js';
import { operatorRouter } from './operator.js';
import { shopRouter } from './shop.js';
import { socialGraphRouter } from './social/index.js';
import { socialRouter } from './social.js';
import { reportsRouter } from './reports.js';
import { userRouter } from './user.js';
import { legacyPublishingPathDeprecation } from '../middleware/legacy-publishing-path-deprecation.js';
import { legacyHostApiRewrite } from '../middleware/legacy-host-api-rewrite.js';
import { legacyMemberStatusPathRewrite } from '../middleware/legacy-member-status-path-rewrite.js';

export const apiRouter = Router();

apiRouter.use(legacyPublishingPathDeprecation);
apiRouter.use(legacyHostApiRewrite);
apiRouter.use(legacyMemberStatusPathRewrite);

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/operator', operatorRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/social', socialGraphRouter);
apiRouter.use('/', socialRouter);
apiRouter.use('/', userRouter);
