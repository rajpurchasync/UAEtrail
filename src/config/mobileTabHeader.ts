import { MESSAGES_PATH, MY_TRIPS_PATH, PLAN_PATH } from './surfacePaths';
import { shouldShowMobileBottomNav } from './platform';

export type MobileTabHeaderCenter =
  | { kind: 'brand' }
  | { kind: 'title'; text: string };

const TAB_HEADER_ROUTES = new Set([
  '/explore',
  '/profile',
  PLAN_PATH,
  '/trips',
  '/activities',
  MY_TRIPS_PATH,
  MESSAGES_PATH,
]);

export const isMobileTabHeaderRoute = (pathname: string): boolean => TAB_HEADER_ROUTES.has(pathname);

/** Root bottom-nav tabs share one unified mobile header; profile sub-routes keep ConsumerShell back chrome. */
export const shouldShowMobileUnifiedTabHeader = (
  pathname: string,
  search: string,
  signedIn: boolean
): boolean => {
  if (pathname === '/explore') {
    // List overlay is a search/discover sheet under this header — keep avatar + actions visible.
    return true;
  }
  if (!isMobileTabHeaderRoute(pathname)) return false;
  if (!signedIn) return false;
  return shouldShowMobileBottomNav(pathname, search, signedIn);
};
