import type { NavigateFunction } from 'react-router-dom';
import {
  PRODUCT_CREWS_TAB_LABEL,
  PRODUCT_GROUPS_SURFACE_LABEL,
  PRODUCT_PLAN_SURFACE_TITLE,
  PRODUCT_MY_CREW_SURFACE_TITLE,
} from '../content/productNorthStar';
import { planWishlistTabPath } from '../plan/planTab';
import { EXPLORE_MAP_PATH, MESSAGES_PATH, PLAN_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { resolveMobileTabHeaderTitle } from '../config/mobileTabHeader';
import { SETTINGS_SURFACE_TITLE } from '../config/settingsHub';
import { isTransientBackPath, navigateBack } from './backStack';
import { exploreMapPathAfterPeopleFullScreen } from '../discovery/discoveryPortExploreBrowseReturnPath';
import { crewsHomePath } from '../config/mobileFiveTabNav';
import { isMobileBottomNavTabPath } from '../config/platform';
import {
  MY_CREWS_PATH,
  CREWS_ORIGIN_QUERY,
  GROUPS_PATH,
  groupsManagePath,
  isCrewsOriginQuery,
  isAppSettingsPath,
  isJourneyMapPath,
  isNotificationHubPath,
  MY_REQUESTS_PATH,
  PROFILE_HISTORY_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_SAFETY_PATH,
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

/**
 * Back chrome when opening the notifications inbox from the bell / header.
 * Labels the *previous* screen (Explore, Profile, …) — not Settings unless that is where you were.
 */
export const notificationsInboxMobileBackState = (
  pathname: string,
  search = ''
): MobileBackNavState => {
  const pathOnly = pathname.split('?')[0] || pathname;
  const from = `${pathOnly}${search}`;

  if (isNotificationHubPath(pathOnly) || pathOnly === APP_SETTINGS_PATH) {
    return mobileBackNavState(APP_SETTINGS_PATH, SETTINGS_SURFACE_TITLE);
  }
  if (isAppSettingsPath(pathOnly)) {
    return mobileBackNavState(APP_SETTINGS_PATH, SETTINGS_SURFACE_TITLE);
  }
  if (pathOnly === EXPLORE_MAP_PATH || pathOnly.startsWith(`${EXPLORE_MAP_PATH}/`)) {
    return mobileBackNavState(from || EXPLORE_MAP_PATH, 'Explore');
  }
  if (pathOnly === PROFILE_PATH) {
    return profileHubMobileBackState();
  }

  const title = resolveMobileTabHeaderTitle(pathOnly, search);
  if (title) {
    return mobileBackNavState(from, title);
  }
  return mobileBackNavState(from || EXPLORE_MAP_PATH, 'Explore');
};

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
    return null;
  }

  if (pathname === MESSAGES_PATH) {
    const params = searchParamsOf(search);
    const inThread = Boolean(params.get('to') || params.get('group'));
    const parsedNav = parseMobileBackNavState(locationState);
    if (parsedNav) {
      return resolveMobileBackChrome(locationState, {
        fallbackTo: MESSAGES_PATH,
        label: 'Chat',
      });
    }
    if (!inThread) return null;
    return flowBack(MESSAGES_PATH, 'Chat');
  }

  if (pathname === MY_CREWS_PATH) {
    const params = searchParamsOf(search);
    const section = params.get('section') ?? params.get('tab');
    const crewsOrigin = isCrewsOriginQuery(params.get('from'));
    if (section === 'friends' || section === 'requests' || section === 'following') {
      return flowBack(MY_CREWS_PATH, PRODUCT_MY_CREW_SURFACE_TITLE);
    }
    if (crewsOrigin) {
      return flowBack(crewsHomePath(), PRODUCT_CREWS_TAB_LABEL);
    }
    return null;
  }

  if (pathname === GROUPS_PATH) {
    const params = searchParamsOf(search);
    const groupId = params.get('group');
    const crewsOrigin = isCrewsOriginQuery(params.get('from'));
    const teamsListPath = crewsOrigin
      ? `${GROUPS_PATH}?${new URLSearchParams({ from: CREWS_ORIGIN_QUERY })}`
      : GROUPS_PATH;
    if (groupId) {
      const section = params.get('section');
      const manageFrom = crewsOrigin ? { from: CREWS_ORIGIN_QUERY } : undefined;
      if (
        section === 'members' ||
        section === 'edit' ||
        section === 'invite' ||
        section === 'kids' ||
        section === 'settings'
      ) {
        return flowBack(groupsManagePath(groupId, 'hub', manageFrom), 'Team');
      }
      return flowBack(teamsListPath, PRODUCT_GROUPS_SURFACE_LABEL);
    }
    if (crewsOrigin) {
      return flowBack(crewsHomePath(), PRODUCT_CREWS_TAB_LABEL);
    }
    return null;
  }

  if (pathname === MY_REQUESTS_PATH) {
    return null;
  }

  if (pathname === APP_SETTINGS_PATH) {
    return null;
  }

  if (pathname === APP_SETTINGS_DISPLAY_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: APP_SETTINGS_PATH,
      label: SETTINGS_SURFACE_TITLE,
    });
  }
  if (pathname === APP_SETTINGS_ACCOUNT_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: APP_SETTINGS_PATH,
      label: SETTINGS_SURFACE_TITLE,
    });
  }
  if (pathname === APP_SETTINGS_PRIVACY_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: APP_SETTINGS_PATH,
      label: SETTINGS_SURFACE_TITLE,
    });
  }
  if (
    pathname === APP_SETTINGS_NOTIFICATIONS_PATH ||
    pathname === APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH ||
    pathname === APP_SETTINGS_NOTIFICATIONS_SAVED_PATH
  ) {
    return profileStackBack(locationState, {
      fallbackTo: APP_SETTINGS_PATH,
      label: SETTINGS_SURFACE_TITLE,
    });
  }
  if (pathname === APP_SETTINGS_SAFETY_PATH) {
    return profileStackBack(locationState, {
      fallbackTo: APP_SETTINGS_PATH,
      label: SETTINGS_SURFACE_TITLE,
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

/**
 * True when layout `MobileUnifiedTabHeader` shows the profile avatar on the left
 * (tab hubs + profile roots). Elsewhere the leading slot is back chrome — Profile
 * must stay reachable from the hamburger.
 */
export const mobileUnifiedHeaderShowsProfileLeading = (
  pathname: string,
  locationState: unknown,
  search = ''
): boolean => {
  if (resolveMobileTabHeaderLeadingBack(pathname, locationState, search) !== null) {
    return false;
  }
  if (pathname === PROFILE_PATH || pathname === EXPLORE_MAP_PATH || pathname === '/explore') {
    return true;
  }
  if (isMobileBottomNavTabPath(pathname)) return true;
  if (pathname === MY_CREWS_PATH) {
    const params = searchParamsOf(search);
    const section = params.get('section') ?? params.get('tab');
    return !section;
  }
  if (pathname === GROUPS_PATH) {
    return !searchParamsOf(search).get('group');
  }
  if (pathname === MY_REQUESTS_PATH) return true;
  if (pathname === APP_SETTINGS_PATH) return true;
  return false;
};
