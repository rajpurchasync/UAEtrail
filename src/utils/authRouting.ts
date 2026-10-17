import {
  EXPLORE_MAP_PATH,
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PLACES_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_SHOP_PATH,
  ADMIN_USERS_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  PLAN_PATH,
  PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  exploreOrganizePath,
  messagesToUserPath,
  planHostedSchedulePath,
} from '../config/routingCatalog';
import { UserRole } from '@uaetrail/shared-types';

import { myActivitiesPath } from '../explore/routing';
import { organisationManagePath } from '../config/routingCatalog';
import { isPlatformAdmin } from './roles';

export const defaultRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_OVERVIEW_PATH;
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') {
    return OPERATOR_OVERVIEW_PATH;
  }
  return EXPLORE_MAP_PATH;
};

/** Participant account home — all explorers including hosts and shop owners. */
export const accountRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_OVERVIEW_PATH;
  return PROFILE_PATH;
};

/**
 * `/operator/*` bookmarks for members without tenant console roles — send to consumer surfaces.
 */
export const participantHostBookmarkRedirect = (pathname: string): string => {
  if (pathname.startsWith('/operator/messages')) {
    return MESSAGES_PATH;
  }
  if (pathname.startsWith('/operator/requests')) return MY_REQUESTS_PATH;
  if (pathname.startsWith('/operator/activities')) return planHostedSchedulePath();
  if (pathname.startsWith('/operator/places') || pathname.startsWith('/operator/locations')) {
    return organisationManagePath();
  }
  if (pathname.startsWith('/operator/team') || pathname.startsWith('/operator/profile')) {
    return PRO_MEMBERSHIP_PATH;
  }
  if (pathname === '/operator/overview' || pathname.startsWith('/operator/overview')) {
    return exploreOrganizePath();
  }
  if (pathname.startsWith('/operator/history')) return PLAN_PATH;
  if (pathname.startsWith('/operator/security-privacy')) return PROFILE_PATH;
  return PLAN_PATH;
};

export const participantDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'overview':
      return PROFILE_PATH;
    case 'requests':
      return MY_REQUESTS_PATH;
    case 'activities':
      return myActivitiesPath();
    case 'messages':
      return MESSAGES_PATH;
    case 'profile':
      return PROFILE_PATH;
    default:
      return PROFILE_PATH;
  }
};

export const hostDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'messages':
      return MESSAGES_PATH;
    case 'requests':
      return OPERATOR_REQUESTS_PATH;
    case 'activities':
      return OPERATOR_ACTIVITIES_PATH;
    case 'profile':
      return OPERATOR_PROFILE_PATH;
    default:
      return OPERATOR_OVERVIEW_PATH;
  }
};

export const adminDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'users':
      return ADMIN_USERS_PATH;
    case 'activities':
      return ADMIN_ACTIVITIES_PATH;
    case 'locations':
    case 'places':
      return ADMIN_PLACES_PATH;
    case 'hosts':
    case 'organizers':
      return ADMIN_HOSTS_PATH;
    case 'groups':
      return ADMIN_GROUPS_PATH;
    case 'shop':
      return ADMIN_SHOP_PATH;
    case 'notifications':
      return ADMIN_NOTIFICATIONS_PATH;
    case 'audit-log':
      return ADMIN_AUDIT_LOG_PATH;
    case 'settings':
      return ADMIN_SETTINGS_PATH;
    default:
      return ADMIN_OVERVIEW_PATH;
  }
};

/** Legacy /dashboard/* aliases for shop owners — management lives under /organisation/manage. */
export const merchantDashboardRedirect = (_subpath: string): string => organisationManagePath('shop');

/** Deep link to messages for the current role. */
export const messagesRouteForRole = (
  role: UserRole,
  userId: string,
  options?: { activityId?: string }
): string => {
  if (role === 'platform_admin') return '/admin/overview';
  if (role === 'merchant_admin') return MESSAGES_PATH;
  const base = messagesToUserPath(userId);
  if (!options?.activityId) {
    return base;
  }
  const params = new URLSearchParams({ to: userId, activity: options.activityId });
  return `${MESSAGES_PATH}?${params.toString()}`;
};
