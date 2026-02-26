import { UserRole } from '@uaetrail/shared-types';

export const defaultRouteByRole = (role: UserRole): string => {
  if (role === 'platform_admin') return '/admin/overview';
  if (role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide') return '/organizer/overview';
  return '/dashboard/overview';
};
