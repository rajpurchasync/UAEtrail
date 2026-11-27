import { AdminUserType } from '@uaetrail/shared-types';

/** Member taxonomy labels for admin UI. */
export const MEMBER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_host: 'Business operator',
  guide_host: 'Guide',
  host_staff: 'Operator staff',
  platform_admin: 'Platform admin',
};

export const MEMBER_TYPE_BADGE: Record<AdminUserType, string> = {
  participant: 'bg-gray-100 text-gray-800',
  business_host: 'bg-blue-100 text-blue-800',
  guide_host: 'bg-emerald-100 text-emerald-800',
  host_staff: 'bg-cyan-100 text-cyan-800',
  platform_admin: 'bg-purple-100 text-purple-800',
};

export const isOrganisationOwnerUserType = (userType?: string) => userType === 'business_host';
