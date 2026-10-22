import { EXPLORE_MAP_PATH, MESSAGES_PATH, PLAN_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { exploreMapPathAfterPeopleFullScreen } from '../explore/exploreBrowseReturnPath';
import { isJourneyMapPath, isProfileHistoryListPath } from '../config/surfacePaths';

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

export const resolveMobileBackChrome = (
  locationState: unknown,
  defaults: { fallbackTo: string; label: string }
): MobileBackChrome => {
  const parsed = parseMobileBackNavState(locationState);
  if (parsed) {
    return {
      fallbackTo: parsed.from,
      label: parsed.backLabel ?? defaults.label,
      /** Explicit return path — avoids `history -1` skipping past cross-route handoffs. */
      backBehavior: 'fallback',
    };
  }
  return {
    fallbackTo: defaults.fallbackTo,
    label: defaults.label,
    backBehavior: 'history',
  };
};

const usesUnifiedTabHeaderBack = (pathname: string): boolean =>
  pathname === PLAN_PATH ||
  pathname === MESSAGES_PATH ||
  isProfileHistoryListPath(pathname) ||
  isJourneyMapPath(pathname);

/** Leading control for `MobileTabHeader` on hub tab routes (not Explore / Profile root). */
export const resolveMobileTabHeaderLeadingBack = (
  pathname: string,
  locationState: unknown
): MobileBackChrome | null => {
  if (!usesUnifiedTabHeaderBack(pathname)) return null;
  return resolveMobileBackChrome(locationState, {
    fallbackTo: EXPLORE_MAP_PATH,
    label: 'Back',
  });
};
