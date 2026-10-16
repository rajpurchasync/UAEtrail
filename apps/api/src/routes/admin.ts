import { UserRole } from '../domain/enums.js';
import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { registerAdminActivityModerationRoutes } from './admin/registerAdminActivityModerationRoutes.js';
import { registerAdminAuditRoutes } from './admin/registerAdminAuditRoutes.js';
import { registerAdminContentReportRoutes } from './admin/registerAdminContentReportRoutes.js';
import { registerAdminGroupRoutes } from './admin/registerAdminGroupRoutes.js';
import { registerAdminHostApplicationRoutes } from './admin/registerAdminHostApplicationRoutes.js';
import { registerAdminMetricsRoutes } from './admin/registerAdminMetricsRoutes.js';
import { registerAdminNotificationRoutes } from './admin/registerAdminNotificationRoutes.js';
import { registerAdminPlaceRoutes } from './admin/registerAdminPlaceRoutes.js';
import { registerAdminFacilityRoutes } from './admin/registerAdminFacilityRoutes.js';
import { registerAdminAreaRoutes } from './admin/registerAdminAreaRoutes.js';
import { registerAdminPlatformStaffRoutes } from './admin/registerAdminPlatformStaffRoutes.js';
import { registerAdminProductRoutes } from './admin/registerAdminProductRoutes.js';
import { registerAdminTenantRoutes } from './admin/registerAdminTenantRoutes.js';
import { registerAdminUserRoutes } from './admin/registerAdminUserRoutes.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireVerifiedEmail, requireRole([UserRole.PLATFORM_ADMIN]));

registerAdminHostApplicationRoutes(adminRouter);
registerAdminPlaceRoutes(adminRouter);
registerAdminFacilityRoutes(adminRouter);
registerAdminAreaRoutes(adminRouter);
// Activity creation for platform admins uses POST/PATCH /host/activities with x-tenant-id.
registerAdminActivityModerationRoutes(adminRouter);
registerAdminMetricsRoutes(adminRouter);
registerAdminUserRoutes(adminRouter);
registerAdminTenantRoutes(adminRouter);
registerAdminGroupRoutes(adminRouter);
registerAdminContentReportRoutes(adminRouter);
registerAdminAuditRoutes(adminRouter);
registerAdminNotificationRoutes(adminRouter);
registerAdminProductRoutes(adminRouter);
registerAdminPlatformStaffRoutes(adminRouter);
