import { UserRole } from '../domain/enums.js';
import { countAdminMetrics } from '../lib/admin-store.js';
import { countActivityParticipants, countPendingActivityRequests } from '../lib/activity-engagement-store.js';
import { countAuthUsers } from '../lib/auth-users.js';
import { countSocialGroups } from '../lib/social-groups-store.js';

export const loadAdminDashboardMetrics = async () => {
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

  return {
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
  };
};
