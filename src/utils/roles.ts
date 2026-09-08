import type { UserRole } from '@uaetrail/shared-types';

/** Participant with approved hosting eligibility (tenant membership). */
export const isHostRole = (role?: string | null): role is UserRole =>
  role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide';

export const isPlatformAdmin = (role?: string | null): boolean => role === 'platform_admin';

export const isMerchantRole = (role?: string | null): boolean => role === 'merchant_admin';
