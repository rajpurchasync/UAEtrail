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
import { registerAdminSubmissionRoutes } from './admin/registerAdminSubmissionRoutes.js';
import { registerAdminAlertRoutes } from './admin/registerAdminAlertRoutes.js';
import { registerAdminAmenityReportRoutes } from './admin/registerAdminAmenityReportRoutes.js';
import { registerAdminVerificationRoutes } from './admin/registerAdminVerificationRoutes.js';
import { registerAdminPlatformStaffRoutes } from './admin/registerAdminPlatformStaffRoutes.js';
import { registerAdminTenantRoutes } from './admin/registerAdminTenantRoutes.js';
import { registerAdminUserRoutes } from './admin/registerAdminUserRoutes.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireVerifiedEmail, requireRole([UserRole.PLATFORM_ADMIN]));

registerAdminHostApplicationRoutes(adminRouter);
registerAdminPlaceRoutes(adminRouter);
registerAdminFacilityRoutes(adminRouter);
registerAdminAreaRoutes(adminRouter);
registerAdminSubmissionRoutes(adminRouter);
registerAdminAlertRoutes(adminRouter);
registerAdminAmenityReportRoutes(adminRouter);
registerAdminVerificationRoutes(adminRouter);
// Outing publish for tenants is POST/PATCH /publishing/activities — admin only moderates.
registerAdminActivityModerationRoutes(adminRouter);
registerAdminMetricsRoutes(adminRouter);
registerAdminUserRoutes(adminRouter);
registerAdminTenantRoutes(adminRouter);
registerAdminGroupRoutes(adminRouter);
registerAdminContentReportRoutes(adminRouter);
registerAdminAuditRoutes(adminRouter);
registerAdminNotificationRoutes(adminRouter);
registerAdminPlatformStaffRoutes(adminRouter);
