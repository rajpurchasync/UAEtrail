import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireTenantContext } from '../middleware/tenant.js';
import { registerHostSubmittedLocationRoutes } from './host/registerHostSubmittedLocationRoutes.js';
import { registerHostTenantActivityRoutes } from './host/registerHostTenantActivityRoutes.js';

export const hostRouter = Router();

hostRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

registerHostSubmittedLocationRoutes(hostRouter);
registerHostTenantActivityRoutes(hostRouter);
