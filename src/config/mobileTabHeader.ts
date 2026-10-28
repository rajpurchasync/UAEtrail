import {
  BUDDIES_PATH,
  GROUPS_PATH,
  INBOUND_CONTRIBUTIONS_PATH,
  MY_REQUESTS_PATH,
  PROFILE_SUBMISSIONS_PATH,
} from './routingCatalog';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import { joinedSubViewTitle } from '../pages/activities/shared';
import {
  isConsumerChromeHidden,
  isConsumerEntityDetailRoute,
  isMobileBottomNavTabPath,
  MOBILE_BOTTOM_NAV_PROFILE_PATHS,
  shouldShowConsumerShellHamburger,
  shouldShowMobileBottomNav,
} from './platform';
import {
  MESSAGES_PATH,
  NOTIFICATIONS_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  JOURNEY_MAP_PATH,
  PROFILE_PATH,
  PROFILE_REVIEWS_PATH,
  PROFILE_VEHICLES_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_SAFETY_PATH,
} from './surfacePaths';

export type MobileTabHeaderCenter =
  | { kind: 'brand' }
  | { kind: 'title'; text: string };

const TAB_HEADER_ROUTES = new Set([
  '/explore',
  PROFILE_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  JOURNEY_MAP_PATH,
  MESSAGES_PATH,
]);

export const isMobileTabHeaderRoute = (pathname: string): boolean => TAB_HEADER_ROUTES.has(pathname);

const LAYOUT_UNIFIED_HEADER_EXACT = new Set([
  NOTIFICATIONS_PATH,
  '/faq',
  '/terms',
  '/privacy',
  '/security-privacy',
  BUDDIES_PATH,
  GROUPS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  INBOUND_CONTRIBUTIONS_PATH,
  MY_REQUESTS_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_SAFETY_PATH,
  '/profile/edit',
  '/profile/pro-membership',
  '/profile/badges',
]);

/** Routes that use layout `MobileUnifiedTabHeader` (not entity detail shells). */
export const isLayoutMobileUnifiedHeaderRoute = (pathname: string): boolean => {
  if (isConsumerChromeHidden(pathname)) return false;
  if (isConsumerEntityDetailRoute(pathname)) return false;
  // Member cards title themselves in ConsumerShell (display name), not "Member".
  if (pathname.startsWith('/member/')) return false;
  if (pathname === '/explore' || isMobileTabHeaderRoute(pathname)) return true;
  if (pathname.startsWith('/profile/')) return true;
  if (LAYOUT_UNIFIED_HEADER_EXACT.has(pathname)) return true;
  return (MOBILE_BOTTOM_NAV_PROFILE_PATHS as readonly string[]).includes(pathname);
};

export const resolveMobileTabHeaderTitle = (pathname: string, search: string): string | null => {
  if (pathname === '/explore') return null;
  if (pathname === PROFILE_PATH) return 'Profile';
  if (pathname === PLAN_PATH) {
    const params = new URLSearchParams(search);
    const subTitle = joinedSubViewTitle(params.get('sub'));
    if (subTitle) return subTitle;
    return PRODUCT_PLAN_SURFACE_TITLE;
  }
  if (pathname === MESSAGES_PATH) return 'Chat';
  if (pathname === PROFILE_HISTORY_PATH) return 'History';
  if (pathname === JOURNEY_MAP_PATH) return 'My Map';
  if (pathname === NOTIFICATIONS_PATH) return 'Notifications';
  if (pathname === PROFILE_SETTINGS_PATH) return 'Settings';
  if (pathname === PROFILE_SETTINGS_ACCOUNT_PATH) return 'Account';
  if (pathname === PROFILE_SETTINGS_PRIVACY_PATH) return 'Privacy';
  if (pathname === PROFILE_SETTINGS_NOTIFICATIONS_PATH) return 'Notifications';
  if (pathname === PROFILE_SETTINGS_SAFETY_PATH) return 'Safety & emergency';
  if (pathname === '/profile/edit') return 'Edit profile';
  if (pathname === '/profile/pro-membership') return 'Pro membership';
  if (pathname === '/profile/badges') return 'Badges';
  if (pathname === PROFILE_REVIEWS_PATH) return 'Reviews';
  if (pathname === PROFILE_VEHICLES_PATH) return 'My cars';
  if (pathname === `${PROFILE_VEHICLES_PATH}/new`) return 'Add car';
  if (/^\/profile\/vehicles\/[^/]+\/edit$/.test(pathname)) return 'Edit car';
  if (pathname === BUDDIES_PATH) return 'Friends';
  if (pathname === GROUPS_PATH) return 'Groups';
  if (pathname === PROFILE_SUBMISSIONS_PATH) return 'Submissions';
  if (pathname === INBOUND_CONTRIBUTIONS_PATH) return 'Contributions';
  if (pathname === MY_REQUESTS_PATH) return 'My requests';
  if (pathname === '/faq') return 'FAQ';
  if (pathname === '/terms') return 'Terms';
  if (pathname === '/privacy') return 'Privacy';
  if (pathname === '/security-privacy') return 'Security & privacy';
  if (pathname.startsWith('/profile/')) {
    const segment = pathname.split('/').filter(Boolean).pop() ?? 'Profile';
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
};

/** Root bottom-nav tabs share one unified mobile header; profile sub-routes keep ConsumerShell back chrome. */
export const shouldShowMobileUnifiedTabHeader = (
  pathname: string,
  search: string,
  signedIn: boolean
): boolean => {
  if (!isLayoutMobileUnifiedHeaderRoute(pathname)) return false;
  if (pathname === '/explore') return true;
  if (!signedIn) return isMobileBottomNavTabPath(pathname);
  if (shouldShowMobileBottomNav(pathname, search, signedIn)) return true;
  if (shouldShowConsumerShellHamburger(pathname)) return true;
  return false;
};
