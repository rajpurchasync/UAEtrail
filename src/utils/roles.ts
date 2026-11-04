import type { UserRole } from '@uaetrail/shared-types';

/** Participant with approved hosting eligibility (tenant membership). */
export const isHostRole = (role?: string | null): role is UserRole =>
  role === 'tenant_owner' || role === 'tenant_admin' || role === 'tenant_guide';

export const isPlatformAdmin = (role?: string | null): boolean => role === 'platform_admin';

/** Platform admins stay on `/admin/*` until they switch to visitor. */
export const isPlatformAdminConsolePath = (pathname: string): boolean =>
  pathname === '/admin' || pathname.startsWith('/admin/');

/** Member hub / settings stack — platform admins use `/admin/account` until they switch to visitor. */
export const isConsumerProfilePath = (pathname: string): boolean =>
  pathname === '/profile' || pathname.startsWith('/profile/');

export const isMerchantRole = (role?: string | null): boolean => role === 'merchant_admin';
