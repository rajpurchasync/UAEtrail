import {
  EXPLORE_MAP_PATH,
  ADMIN_ACTIVITIES_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_INBOX_PATH,
  ADMIN_PLACES_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_ACCOUNT_PATH,
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
  messagesToUserPath,
} from '../config/routingCatalog';
import { planHostingFilterPath } from '../plan/planRouting';
import { UserRole } from '@uaetrail/shared-types';

import { myActivitiesPath } from '../explore/routing';
import { organisationManagePath } from '../config/routingCatalog';
import { isPlatformAdmin } from './roles';

export const defaultRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_INBOX_PATH;
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') {
    /** Sync fallback — prefer `resolveHostingHubPath` / `navigateToHostModeHome` when status is loaded. */
    return OPERATOR_OVERVIEW_PATH;
  }
  return EXPLORE_MAP_PATH;
};

/** Personal hub (profile / admin account) — not the host-mode home. */
export const accountRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_ACCOUNT_PATH;
  return PROFILE_PATH;
};

/** Host-mode app home after login / Switch to Host (workspace overview until dual-mode status loads). */
export const hostModeHomeRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return ADMIN_INBOX_PATH;
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') {
    return OPERATOR_OVERVIEW_PATH;
  }
  return EXPLORE_MAP_PATH;
};

/**
 * Legacy `/publishing/*` and `/operator/*` bookmarks for members **without** `canAccessPublishingWorkspace`.
 * Consumer equivalents only — not explore compose shims (O0.5).
 */
export const participantHostBookmarkRedirect = (pathname: string): string => {
  const rest = pathname.replace(/^\/(?:publishing|operator)(?=\/|$)/, '') || '/';
  if (rest.startsWith('/messages')) {
    return MESSAGES_PATH;
  }
  if (rest.startsWith('/requests')) return MY_REQUESTS_PATH;
  if (rest.startsWith('/activities')) return planHostingFilterPath();
  if (rest.startsWith('/places') || rest.startsWith('/locations')) {
    return organisationManagePath();
  }
  if (rest.startsWith('/team') || rest.startsWith('/profile')) {
    return PRO_MEMBERSHIP_PATH;
  }
  if (rest === '/overview' || rest.startsWith('/overview')) {
    return PROFILE_PATH;
  }
  if (rest.startsWith('/history')) return PLAN_PATH;
  if (rest.startsWith('/security-privacy')) return PROFILE_PATH;
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
      return ADMIN_HOSTS_PATH;
    case 'notifications':
      return ADMIN_NOTIFICATIONS_PATH;
    case 'audit-log':
      return ADMIN_AUDIT_LOG_PATH;
    case 'settings':
      return ADMIN_SETTINGS_PATH;
    case 'account':
      return ADMIN_ACCOUNT_PATH;
    case 'overview':
    case 'inbox':
      return ADMIN_INBOX_PATH;
    case 'submissions':
      return '/admin/inbox/submissions';
    default:
      return ADMIN_INBOX_PATH;
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
  if (role === 'platform_admin') return ADMIN_INBOX_PATH;
  if (role === 'merchant_admin') return MESSAGES_PATH;
  const base = messagesToUserPath(userId);
  if (!options?.activityId) {
    return base;
  }
  const params = new URLSearchParams({ to: userId, activity: options.activityId });
  return `${MESSAGES_PATH}?${params.toString()}`;
};
