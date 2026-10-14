import type { UserRole } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { canReturnAfterAuth } from './authRedirect';
import {
  clearAuthReturnContext,
  parseAuthReturnContextFromSearch,
  saveAuthReturnContext,
} from './authReturnContext';

export const resolvePostAuthReturnPath = (
  from: string | undefined,
  role: UserRole | string
): string | undefined => {
  if (!from) return undefined;
  if (!canReturnAfterAuth(from, role)) return undefined;
  return from;
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
