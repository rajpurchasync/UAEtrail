import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireTenantContext } from '../middleware/tenant.js';
import { registerHostSubmittedLocationRoutes } from './host/registerHostSubmittedLocationRoutes.js';
import { registerHostActivityRoutes } from './host/registerHostActivityRoutes.js';

export const hostRouter = Router();

hostRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

registerHostSubmittedLocationRoutes(hostRouter);
registerHostActivityRoutes(hostRouter);
