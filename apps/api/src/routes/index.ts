import { Router } from 'express';
import { authLimiter } from '../middleware/rate-limit-instances.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { mediaRouter } from './media.js';
import { organizerRouter } from './organizer.js';
import { shopRouter } from './shop.js';
import { socialRouter } from './social.js';
import { reportsRouter } from './reports.js';
import { userRouter } from './user.js';

export const apiRouter = Router();

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/organizer', organizerRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/', socialRouter);
apiRouter.use('/', userRouter);
