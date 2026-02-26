import { Router } from 'express';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { mediaRouter } from './media.js';
import { organizerRouter } from './organizer.js';
import { userRouter } from './user.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/organizer', organizerRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/', userRouter);
