import { AdminUserType } from '@uaetrail/shared-types';

/** Member taxonomy labels for admin UI (auth-backed `AdminUserType` enum values unchanged). */
export const MEMBER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_host: 'Business operator',
  guide_host: 'Guide',
  host_staff: 'Operator staff',
  platform_admin: 'Platform admin',
  business_organizer: 'Business operator',
  guide_organizer: 'Guide',
  organizer_staff: 'Operator staff',
};

export const MEMBER_TYPE_BADGE: Record<AdminUserType, string> = {
  participant: 'bg-gray-100 text-gray-800',
  business_host: 'bg-blue-100 text-blue-800',
  guide_host: 'bg-emerald-100 text-emerald-800',
  host_staff: 'bg-cyan-100 text-cyan-800',
  platform_admin: 'bg-purple-100 text-purple-800',
  business_organizer: 'bg-blue-100 text-blue-800',
  guide_organizer: 'bg-emerald-100 text-emerald-800',
  organizer_staff: 'bg-cyan-100 text-cyan-800',
};

export const isOrganisationOwnerUserType = (userType?: string) =>
  userType === 'business_host' || userType === 'business_organizer';
