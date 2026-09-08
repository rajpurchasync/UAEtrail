import { UserRole } from '@uaetrail/shared-types';
import { isMerchantRole, isPlatformAdmin } from './roles';

export const defaultRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return '/admin/overview';
  if (isMerchantRole(role)) return '/merchant/dashboard';
  return '/';
};

/** Participant account home — all explorers including hosts. */
export const accountRouteByRole = (role: UserRole): string => {
  if (isPlatformAdmin(role)) return '/admin/overview';
  if (isMerchantRole(role)) return '/merchant/dashboard';
  return '/profile';
};

export const participantDashboardRedirect = (subpath: string): string => {
  switch (subpath) {
    case 'overview':
      return '/profile';
    case 'requests':
      return '/my-requests';
    case 'trips':
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
    case 'trips':
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
      return '/admin/locations';
    case 'settings':
      return '/admin/settings';
    default:
      return '/admin/overview';
  }
};

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
