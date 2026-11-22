import {
  GROUPS_PATH,
  INBOUND_RETIRED_CONSOLE_PREFIXES,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  NOTIFICATIONS_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_PATH,
  OPERATOR_CONSOLE_PREFIX,
} from '../config/routingCatalog';
import type { UserRole } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { navigateBack } from './backStack';
import { stripSessionExpiredQuery } from './authSessionLanding';

const AUTH_LOOP_PATHS = new Set(['/signin', '/signup', '/verify']);

/** Guest marketing home — dismiss target when sign-in has no parent screen. */
export const AUTH_GUEST_HOME_PATH = '/' as const;

export const AUTH_UNAVAILABLE_COPY = 'This option isn’t available for your account.';

const MEMBER_SURFACE_PREFIXES = [
  PROFILE_PATH,
  PROFILE_BADGES_PATH,
  MY_REQUESTS_PATH,
  MESSAGES_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  NOTIFICATIONS_PATH,
  GROUPS_PATH,
] as const;

const pathnameOf = (path: string): string => path.split('?')[0]?.split('#')[0] ?? path;

/** Paths that require authentication — unsafe as sign-in dismiss targets. */
const AUTH_GATED_PREFIXES = [
  PROFILE_PATH,
  PROFILE_BADGES_PATH,
  MY_REQUESTS_PATH,
  MESSAGES_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  NOTIFICATIONS_PATH,
  GROUPS_PATH,
  OPERATOR_CONSOLE_PREFIX,
  '/admin',
  '/merchant',
  '/organisation/manage',
  '/agency/manage',
  '/shop/manage',
] as const;

export const isAuthGatedPath = (path: string): boolean => {
  const pathname = pathnameOf(path);
  return AUTH_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

const isMemberSurfacePath = (pathname: string): boolean =>
  MEMBER_SURFACE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Whether an authenticated user may return to this path after sign-in. */
export const canReturnAfterAuth = (path: string, role: UserRole | string): boolean => {
  const pathname = pathnameOf(path);
  if (AUTH_LOOP_PATHS.has(pathname)) return false;

  // Public routes (explore map, trails, shops, etc.) — any role can return.
  if (!isAuthGatedPath(pathname)) return true;
  if (isMemberSurfacePath(pathname)) return true;

  const hostConsoleRoles = ['tenant_owner', 'tenant_admin', 'tenant_guide'];
  if (hostConsoleRoles.includes(role)) {
    return (
      pathname.startsWith(OPERATOR_CONSOLE_PREFIX) ||
      INBOUND_RETIRED_CONSOLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    );
  }
  if (role === 'platform_admin') return pathname.startsWith('/admin');
  if (role === 'merchant_admin') {
    return (
      pathname.startsWith('/organisation/manage') ||
      pathname.startsWith('/shop/manage') ||
      pathname.startsWith('/shop/') ||
      pathname.startsWith('/merchant/')
    );
  }
  return false;
};

/** Resolve post-auth redirect from router state or ?redirect= query param. */
export const resolveAuthRedirect = (
  stateFrom: string | undefined | null,
  searchRedirect: string | null
): string | undefined => {
  const candidate = stateFrom ?? searchRedirect ?? undefined;
  if (!candidate) return undefined;

  const pathname = pathnameOf(candidate);
  if (AUTH_LOOP_PATHS.has(pathname)) {
    return undefined;
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return undefined;
  }
  // Avoid returning to Explore/Home with the guest “session expired” toast still in the URL.
  return stripSessionExpiredQuery(candidate);
};

/** True when `?redirect=` is present but is not a safe in-app path. */
export const isRejectedAuthRedirectParam = (raw: string | null | undefined): boolean => {
  const value = raw?.trim();
  if (!value) return false;
  return resolveAuthRedirect(null, value) === undefined;
};

/** Safe destination when auth chrome is dismissed without browser history. */
export const resolveAuthExitFallback = (redirect?: string | null): string => {
  const candidate = resolveAuthRedirect(redirect, null);
  if (candidate && !isAuthGatedPath(candidate)) {
    return candidate;
  }
  return AUTH_GUEST_HOME_PATH;
};

/**
 * Back from sign-in / sign-up: return to the in-app screen that opened auth
 * (scroll + focus restored). Without in-app history, land on a public
 * fallback — never bounce into a protected route.
 */
export const navigateAuthBack = (navigate: NavigateFunction, redirect?: string | null) => {
  navigateBack(navigate, resolveAuthExitFallback(redirect), { skipPath: isAuthGatedPath });
};

/** Close/dismiss — same parent as Back (opener, or guest home if none). */
export const navigateAuthClose = (navigate: NavigateFunction, redirect?: string | null) => {
  navigateAuthBack(navigate, redirect);
};
