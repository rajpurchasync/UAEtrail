import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireTenantContext } from '../middleware/tenant.js';
import { registerPublishingSubmittedLocationRoutes } from './publishing/registerPublishingSubmittedLocationRoutes.js';
import { registerPublishingActivityRoutes } from './publishing/registerPublishingActivityRoutes.js';
import { registerPublishingShopStorefrontRoutes } from './publishing/registerPublishingShopStorefrontRoutes.js';

/** Operator workspace HTTP (`/workspace/*` + `x-tenant-id`). */
export const workspaceRouter = Router();

workspaceRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

registerPublishingSubmittedLocationRoutes(workspaceRouter);
registerPublishingActivityRoutes(workspaceRouter);
registerPublishingShopStorefrontRoutes(workspaceRouter);