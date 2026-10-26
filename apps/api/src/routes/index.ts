import { Router } from 'express';
import { authLimiter } from '../middleware/rate-limit-instances.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { mediaRouter } from './media.js';
import { publishingRouter } from './publishing.js';
import { shopRouter } from './shop.js';
import { safetyRouter } from './safety.js';
import { userRouter } from './user.js';
import { agentRouter } from './agent.js';
import { geoSearchRouter } from './geo-search.js';

export const apiRouter = Router();

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/publishing', publishingRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/geo', geoSearchRouter);
apiRouter.use('/safety', safetyRouter);
apiRouter.use('/agent', agentRouter);
apiRouter.use('/', userRouter);
