import type { UserRole } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../config/platform';

const AUTH_LOOP_PATHS = new Set(['/signin', '/signup', '/verify']);

const pathnameOf = (path: string): string => path.split('?')[0]?.split('#')[0] ?? path;

/** Paths that require authentication — unsafe as sign-in dismiss targets. */
const AUTH_GATED_PREFIXES = [
  '/profile',
  '/my-rewards',
  '/my-requests',
  '/messages',
  '/notifications',
  '/groups',
  '/host',
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

/** Whether an authenticated user may return to this path after sign-in. */
export const canReturnAfterAuth = (path: string, role: UserRole | string): boolean => {
  const pathname = pathnameOf(path);
  if (AUTH_LOOP_PATHS.has(pathname)) return false;

  // Public routes (explore map, trails, events, etc.) — any role can return.
  if (!isAuthGatedPath(pathname)) return true;

  const hostConsoleRoles = ['tenant_owner', 'tenant_admin', 'tenant_guide'];
  if (hostConsoleRoles.includes(role)) {
    return pathname.startsWith('/host') || pathname.startsWith('/organizer') || pathname.startsWith('/profile');
  }
  if (role === 'platform_admin') return pathname.startsWith('/admin');
  if (role === 'merchant_admin') {
    return (
      pathname.startsWith('/organisation/manage') ||
      pathname.startsWith('/shop/manage') ||
      pathname.startsWith('/shop/') ||
      pathname.startsWith('/merchant/') ||
      pathname.startsWith('/profile')
    );
  }
  return true;
};

/** Resolve post-auth redirect from router state or ?redirect= query param. */
export const resolveAuthRedirect = (
  stateFrom: string | undefined | null,
  searchRedirect: string | null
): string | undefined => {
  const candidate = stateFrom ?? searchRedirect ?? undefined;
  if (!candidate) return undefined;

  const pathname = pathnameOf(candidate);
  if (pathname === '/' || AUTH_LOOP_PATHS.has(pathname)) {
    return undefined;
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return undefined;
  }
  return candidate;
};

/** Safe destination when auth chrome is dismissed without browser history. */
export const resolveAuthExitFallback = (redirect?: string | null): string => {
  const candidate = resolveAuthRedirect(redirect, null);
  if (candidate && !isAuthGatedPath(candidate)) {
    return candidate;
  }
  return EXPLORE_MAP_PATH;
};

/** Prefer real back navigation; never bounce back into protected routes. */
export const navigateAuthBack = (navigate: NavigateFunction, redirect?: string | null) => {
  const safeFallback = resolveAuthExitFallback(redirect);
  const storedFrom = resolveAuthRedirect(redirect, null);

  if (storedFrom && isAuthGatedPath(storedFrom)) {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(safeFallback, { replace: true });
    return;
  }

  if (typeof window !== 'undefined' && window.history.length > 1) {
    navigate(-1);
    return;
  }
  navigate(safeFallback, { replace: true });
};

/** Close/dismiss auth screens — land on explore or another public redirect target. */
export const navigateAuthClose = (navigate: NavigateFunction, redirect?: string | null) => {
  navigate(resolveAuthExitFallback(redirect), { replace: true });
};
