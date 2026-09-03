import { AdminUserType } from '@uaetrail/shared-types';

export const USER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_host: 'Business Host',
  guide_host: 'Individual Host',
  host_staff: 'Host Staff',
  platform_admin: 'Admin',
  business_organizer: 'Business Host',
  guide_organizer: 'Individual Host',
  organizer_staff: 'Host Staff'
};

export const USER_TYPE_BADGE: Record<AdminUserType, string> = {
  participant: 'bg-gray-100 text-gray-800',
  business_host: 'bg-blue-100 text-blue-800',
  guide_host: 'bg-emerald-100 text-emerald-800',
  host_staff: 'bg-cyan-100 text-cyan-800',
  platform_admin: 'bg-purple-100 text-purple-800',
  business_organizer: 'bg-blue-100 text-blue-800',
  guide_organizer: 'bg-emerald-100 text-emerald-800',
  organizer_staff: 'bg-cyan-100 text-cyan-800'
};

export const isBusinessHostUserType = (userType?: string) =>
  userType === 'business_host' || userType === 'business_organizer';
