import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireTenantContext } from '../middleware/tenant.js';
import { registerPublishingSubmittedLocationRoutes } from './publishing/registerPublishingSubmittedLocationRoutes.js';
import { registerPublishingActivityRoutes } from './publishing/registerPublishingActivityRoutes.js';
import { registerPublishingShopStorefrontRoutes } from './publishing/registerPublishingShopStorefrontRoutes.js';

/** Tenant publishing console (`GET/POST /publishing/*` + `x-tenant-id`). */
export const publishingRouter = Router();

publishingRouter.use(requireAuth, requireVerifiedEmail, requireTenantContext);

registerPublishingSubmittedLocationRoutes(publishingRouter);
registerPublishingActivityRoutes(publishingRouter);
registerPublishingShopStorefrontRoutes(publishingRouter);
