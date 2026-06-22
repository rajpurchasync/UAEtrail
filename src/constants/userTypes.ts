import { AdminUserType } from '@uaetrail/shared-types';

export const USER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_organizer: 'Business Organizer',
  guide_organizer: 'Guide Organizer',
  organizer_staff: 'Organizer Staff',
  platform_admin: 'Platform Admin'
};

export const USER_TYPE_BADGE: Record<AdminUserType, string> = {
  participant: 'bg-gray-100 text-gray-800',
  business_organizer: 'bg-blue-100 text-blue-800',
  guide_organizer: 'bg-emerald-100 text-emerald-800',
  organizer_staff: 'bg-cyan-100 text-cyan-800',
  platform_admin: 'bg-purple-100 text-purple-800'
};
