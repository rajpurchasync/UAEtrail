import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireTenantContext } from '../middleware/tenant.js';
import { registerOperatorSubmittedLocationRoutes } from './operator/registerOperatorSubmittedLocationRoutes.js';
import { registerOperatorActivityRoutes } from './operator/registerOperatorActivityRoutes.js';

/** Tenant publishing console (`GET/POST /operator/*` + `x-organisation-id`). */
export const operatorRouter = Router();

operatorRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

registerOperatorSubmittedLocationRoutes(operatorRouter);
registerOperatorActivityRoutes(operatorRouter);
