import type { UserRole } from '@uaetrail/shared-types';

const HOST_ROLES: readonly UserRole[] = ['tenant_owner', 'tenant_admin', 'tenant_guide'];

/** Participant with approved hosting eligibility (tenant membership). */
export const isHostRole = (role?: string | null): role is UserRole =>
  role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide';

export const isPlatformAdmin = (role?: string | null): boolean => role === 'platform_admin';

export const isMerchantRole = (role?: string | null): boolean => role === 'merchant_admin';

/** Signed-in explorer / booker (default persona). */
export const isParticipantRole = (role?: string | null): boolean => role === 'participant';

/** Staff consoles that hide consumer chrome (admin, merchant, host management). */
export const isStaffChromeRole = (role?: string | null): boolean =>
  isHostRole(role) || isPlatformAdmin(role) || isMerchantRole(role);

export const hostRoles = (): readonly UserRole[] => HOST_ROLES;

/** @deprecated Use isHostRole */
export const isOrganizer = isHostRole;
