import { Router } from 'express';
import { authLimiter } from '../middleware/rate-limit-instances.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { mediaRouter } from './media.js';
import { operatorRouter } from './operator.js';
import { shopRouter } from './shop.js';
import { socialRouter } from './social.js';
import { safetyRouter } from './safety.js';
import { userRouter } from './user.js';
import { agentRouter } from './agent.js';

export const apiRouter = Router();

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/operator', operatorRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/safety', safetyRouter);
apiRouter.use('/', socialRouter);
apiRouter.use('/agent', agentRouter);
apiRouter.use('/', userRouter);
