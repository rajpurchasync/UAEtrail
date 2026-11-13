import type { UserRole } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { canReturnAfterAuth } from './authRedirect';
import { stripSessionExpiredQuery } from './authSessionLanding';
import { armViewReturn, seedViewReturnSnapshot } from './viewReturnMemory';
import {
  clearAuthReturnContext,
  parseAuthReturnContextFromSearch,
  saveAuthReturnContext,
} from './authReturnContext';

export const AUTH_UNAVAILABLE_STATE = { authUnavailable: true } as const;

export const resolvePostAuthReturnPath = (
  from: string | undefined,
  role: UserRole | string
): string | undefined => {
  if (!from) return undefined;
  const cleaned = stripSessionExpiredQuery(from);
  const pathname = cleaned.split('?')[0]?.split('#')[0] ?? cleaned;
  if (pathname === '/') return EXPLORE_MAP_PATH;
  if (!canReturnAfterAuth(cleaned, role)) return undefined;
  return cleaned;
};

export const persistAuthReturnContextForPath = (
  from: string,
  searchParams?: URLSearchParams
): void => {
  const context =
    (searchParams && parseAuthReturnContextFromSearch(searchParams, from)) ?? {
      from,
      scrollY: 0,
    };
  saveAuthReturnContext(context);
  if (context.scrollY > 0 || context.focusSelector) {
    seedViewReturnSnapshot(from, {
      scrollTops: [context.scrollY],
      focusSelector: context.focusSelector ?? null,
    });
  }
  // Task done (signed in / profile complete): land on the opener at its remembered scroll / control.
  armViewReturn(from, context.focusSelector ?? null);
};

/** Navigate to the saved return path after sign-in/up; returns false when no safe return target. */
export const navigateToPostAuthReturn = (
  navigate: NavigateFunction,
  from: string | undefined,
  role: UserRole | string,
  searchParams: URLSearchParams
): boolean => {
  const destination = resolvePostAuthReturnPath(from, role);
  if (!destination) {
    clearAuthReturnContext();
    return false;
  }
  persistAuthReturnContextForPath(destination, searchParams);
  navigate(destination, { replace: true });
  return true;
};
