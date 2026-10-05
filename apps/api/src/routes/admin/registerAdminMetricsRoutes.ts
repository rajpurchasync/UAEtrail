import { UserRole } from '../../domain/enums.js';
import { Router } from 'express';
import { countAdminMetrics } from '../../lib/admin-store.js';
import { countActivityParticipants, countPendingActivityRequests } from '../../lib/activity-engagement-store.js';
import { countAuthUsers } from '../../lib/auth-users.js';
import { countSocialGroups } from '../../lib/social-groups-store.js';

/** Platform admin dashboard aggregate metrics (`GET /admin/metrics`). */
export const registerAdminMetricsRoutes = (adminRouter: Router): void => {
  adminRouter.get('/metrics', async (_req, res, next) => {
    try {
      const now = new Date();
      const [metrics, pendingRequests, totalUsers, activeUsers, totalParticipants, totalHosts, totalGroups] =
        await Promise.all([
          countAdminMetrics(now),
          countPendingActivityRequests(),
          countAuthUsers({}),
          countAuthUsers({ status: 'ACTIVE' }),
          countActivityParticipants(),
          countAuthUsers({ role: UserRole.TENANT_OWNER }),
          countSocialGroups(),
        ]);

      res.json({
        data: {
          tenants: metrics.tenantCount,
          activities: metrics.activityCount,
          pendingApplications: metrics.pendingApplications,
          pendingRequests,
          totalUsers,
          activeUsers,
          totalLocations: metrics.totalLocations,
          totalParticipants,
          totalHosts,
          activeActivities: metrics.activeActivities,
          totalGroups,
        },
      });
    } catch (error) {
      next(error);
    }
  });
};
