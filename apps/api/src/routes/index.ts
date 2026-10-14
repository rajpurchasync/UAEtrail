import { Router } from 'express';
import { authLimiter } from '../middleware/rate-limit-instances.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { mediaRouter } from './media.js';
import { hostRouter } from './host.js';
import { shopRouter } from './shop.js';
import { socialGraphRouter } from './social/index.js';
import { socialRouter } from './social.js';
import { reportsRouter } from './reports.js';
import { userRouter } from './user.js';
import { agentRouter } from './agent.js';

export const apiRouter = Router();

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/host', hostRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/social', socialGraphRouter);
apiRouter.use('/', socialRouter);
apiRouter.use('/agent', agentRouter);
apiRouter.use('/', userRouter);
