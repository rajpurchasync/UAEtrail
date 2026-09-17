import { UserRole } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH, ADMIN_PLACES_PATH } from '../config/platform';
import { organisationManagePath } from './organisationPaths';
import { isPlatformAdmin } from './roles';

export const defaultRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return '/admin/overview';
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') {
    return '/host/overview';
  }
  return EXPLORE_MAP_PATH;
};

/** Participant account home — all explorers including hosts and shop owners. */
export const accountRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return '/admin/overview';
  return '/profile';
};

export const participantDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'overview':
      return '/profile';
    case 'requests':
      return '/my-requests';
    case 'activities':
      return '/activities?tab=joined';
    case 'messages':
      return '/messages';
    case 'profile':
      return '/profile';
    default:
      return '/profile';
  }
};

export const hostDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'messages':
      return '/host/messages';
    case 'requests':
      return '/host/requests';
    case 'activities':
      return '/host/activities';
    case 'profile':
      return '/host/profile';
    default:
      return '/host/overview';
  }
};

export const adminDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'users':
      return '/admin/users';
    case 'activities':
      return '/admin/activities';
    case 'locations':
    case 'places':
      return ADMIN_PLACES_PATH;
    case 'hosts':
    case 'organizers':
      return '/admin/hosts';
    case 'groups':
      return '/admin/groups';
    case 'shop':
      return '/admin/shop';
    case 'notifications':
      return '/admin/notifications';
    case 'audit-log':
      return '/admin/audit-log';
    case 'settings':
      return '/admin/settings';
    default:
      return '/admin/overview';
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
  if (role === 'merchant_admin') return '/messages';
  const params = new URLSearchParams({ to: userId });
  if (options?.activityId) params.set('activity', options.activityId);
  const query = params.toString();
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') {
    return `/host/messages?${query}`;
  }
  return `/messages?${query}`;
};
