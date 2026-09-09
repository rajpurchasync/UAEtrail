import type { NavigateFunction } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../config/platform';

const AUTH_LOOP_PATHS = new Set(['/signin', '/signup', '/verify']);

/** Paths that require authentication — unsafe as sign-in dismiss targets. */
const AUTH_GATED_PREFIXES = [
  '/profile',
  '/my-rewards',
  '/my-requests',
  '/messages',
  '/favorites',
  '/notifications',
  '/groups',
  '/host',
  '/admin',
  '/merchant',
  '/agency/manage',
  '/shop/manage',
] as const;

export const isAuthGatedPath = (path: string): boolean => {
  const pathname = path.split('?')[0]?.split('#')[0] ?? path;
  return AUTH_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

/** Resolve post-auth redirect from router state or ?redirect= query param. */
export const resolveAuthRedirect = (
  stateFrom: string | undefined | null,
  searchRedirect: string | null
): string | undefined => {
  const candidate = stateFrom ?? searchRedirect ?? undefined;
  if (!candidate || candidate === '/' || AUTH_LOOP_PATHS.has(candidate)) {
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
