import type { NavigateFunction } from 'react-router-dom';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import { planWishlistTabPath } from '../plan/planTab';
import { EXPLORE_MAP_PATH, MESSAGES_PATH, PLAN_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { isTransientBackPath, navigateBack } from './backStack';
import { exploreMapPathAfterPeopleFullScreen } from '../explore/exploreBrowseReturnPath';
import {
  BUDDIES_PATH,
  GROUPS_PATH,
  isJourneyMapPath,
  MY_REQUESTS_PATH,
  NOTIFICATIONS_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_SAFETY_PATH,
  PROFILE_VEHICLES_PATH,
} from '../config/surfacePaths';

/** Router location state for contextual mobile back chrome. */
export type MobileBackNavState = {
  from: string;
  backLabel?: string;
};

export type MobileBackChrome = {
  fallbackTo: string;
  label: string;
  backBehavior: 'history' | 'fallback';
};

export const mobileBackNavState = (from: string, backLabel = 'Back'): MobileBackNavState => ({
  from,
  backLabel,
});

/** Opened from the signed-in profile hub (`/profile`). */
export const profileHubMobileBackState = (): MobileBackNavState =>
  mobileBackNavState(PROFILE_PATH, 'Profile');

/** Full-screen list/discovery opened from explore map (sheet expand or handoff). */
export const exploreMapMobileBackState = (returnTo?: string): MobileBackNavState =>
  mobileBackNavState(exploreMapPathAfterPeopleFullScreen(returnTo?.trim() || EXPLORE_MAP_PATH), 'Explore');

/** Entity detail opened from Plan → Wishlist (saved list / suggestions). */
export const planWishlistMobileBackState = (): MobileBackNavState =>
  mobileBackNavState(planWishlistTabPath(), PRODUCT_PLAN_SURFACE_TITLE);

export const parseMobileBackNavState = (state: unknown): MobileBackNavState | null => {
  if (!state || typeof state !== 'object') return null;
  const from = (state as MobileBackNavState).from;
  if (typeof from !== 'string' || !from.startsWith('/')) return null;
  const backLabel = (state as MobileBackNavState).backLabel;
  return {
    from,
    backLabel: typeof backLabel === 'string' && backLabel.trim() ? backLabel.trim() : undefined,
  };
};

/** Same path as the header back control: in-app history first, declared parent otherwise. */
export const navigateWithBackChrome = (
  navigate: NavigateFunction,
  chrome: Pick<MobileBackChrome, 'fallbackTo'>
): void => {
  navigateBack(navigate, chrome.fallbackTo);
};

export const resolveMobileBackChrome = (
  locationState: unknown,
  defaults: { fallbackTo: string; label: string; backBehavior?: 'history' | 'fallback' }
): MobileBackChrome => {
  const parsed = parseMobileBackNavState(locationState);
  if (parsed) {
    const label = parsed.backLabel ?? defaults.label;
    const fromPathname = parsed.from.split('?')[0] ?? parsed.from;
    const fromIsTransient = isTransientBackPath(fromPathname);
    const fromIsProfileChild =
      label === 'Profile' &&
      parsed.from !== PROFILE_PATH &&
      parsed.from.startsWith(`${PROFILE_PATH}/`);
    return {
      fallbackTo: fromIsProfileChild ? PROFILE_PATH : fromIsTransient ? defaults.fallbackTo : parsed.from,
      label,
      backBehavior: 'fallback',
    };
  }
  return {
    fallbackTo: defaults.fallbackTo,
    label: defaults.label,
    backBehavior: 'fallback',
  };
};

/** Named parent (Profile, Settings, My cars). History would reopen Edit profile when it is still underneath. */
const profileStackBack = (
  locationState: unknown,
  defaults: { fallbackTo: string; label: string }
): MobileBackChrome =>
  resolveMobileBackChrome(locationState, { ...defaults, backBehavior: 'fallback' });

const PLAN_DRILL_SUBS = new Set(['attended', 'upcoming', 'cancelled', 'rejected']);

const searchParamsOf = (search: string): URLSearchParams =>
  new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

const flowBack = (fallbackTo: string, label: string): MobileBackChrome => ({
  fallbackTo,
  label,
  backBehavior: 'fallback',
});

/** Leading control for `MobileTabHeader` on hub tab routes (not Explore / Profile root). */
export const resolveMobileTabHeaderLeadingBack = (
  pathname: string,
  locationState: unknown,
  search = ''
): MobileBackChrome | null => {
  if (pathname === PROFILE_PATH || pathname === '/explore') return null;

  if (isJourneyMapPath(pathname)) {
    return flowBack(`${PROFILE_HISTORY_PATH}?view=completed`, 'History');
  }

  if (pathname === PLAN_PATH) {
    const sub = searchParamsOf(search).get('sub');
    if (sub && PLAN_DRILL_SUBS.has(sub)) {
      return flowBack(PLAN_PATH, PRODUCT_PLAN_SURFACE_TITLE);
    }
    return resolveMobileBackChrome(locationState, {
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Explore',
    });
  }

  if (pathname === MESSAGES_PATH) {
    const params = searchParamsOf(search);
    const inThread = Boolean(params.get('to') || params.get('group'));
    if (!parseMobileBackNavState(locationState) && inThread) {
      return flowBack(MESSAGES_PATH, 'Chat');
    }
    return resolveMobileBackChrome(locationState, {
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Explore',
    });
  }

  if (pathname === BUDDIES_PATH || pathname === GROUPS_PATH || pathname === MY_REQUESTS_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
    });
  }

  if (pathname === PROFILE_SETTINGS_ACCOUNT_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_SETTINGS_PATH,
      label: 'Settings',
    });
  }
  if (
    pathname === PROFILE_SETTINGS_PRIVACY_PATH ||
    pathname === PROFILE_SETTINGS_NOTIFICATIONS_PATH
  ) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_SETTINGS_PATH,
      label: 'Settings',
    });
  }
  if (pathname === PROFILE_SETTINGS_SAFETY_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
    });
  }
  if (pathname === PROFILE_VEHICLES_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
    });
  }
  if (pathname.startsWith(`${PROFILE_VEHICLES_PATH}/`)) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_VEHICLES_PATH,
      label: 'My cars',
    });
  }
  if (pathname.startsWith('/profile/')) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
    });
  }
  if (pathname === NOTIFICATIONS_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
    });
  }
  if (pathname === '/faq' || pathname === '/terms' || pathname === '/privacy' || pathname === '/security-privacy') {
    return resolveMobileBackChrome(locationState, {
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Explore',
    });
  }
  if (pathname.startsWith('/member/')) {
    return resolveMobileBackChrome(locationState, {
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Explore',
    });
  }

  return null;
};
