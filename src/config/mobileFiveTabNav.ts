/**
 * Mobile five-tab bottom nav — contract (path builders + active-tab resolver).
 *
 * **Product spec:** `docs/NAVIGATION.md` § Mobile five-tab bottom nav.
 * **Program ID:** `MIG-SURFACE-MOBILE-FIVE-TAB` (`scripts/refactor-program.json`).
 *
 * UI wiring (`MobileBottomNav.tsx`) ships in later phases; import these helpers for all new links.
 */

import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from './platform';
import { MESSAGES_PATH, PLAN_PATH } from './surfacePaths';
import { explorePath, parseExplorePanel } from '../explore/routing';
import { parseExplorePinKindFilter } from '../explore/explorePinKindFilter';
import {
  listPeopleDiscoveryPath,
  tripsListHomePath,
  venuesListHomePath,
} from '../list/routing';

export { tripsListHomePath, venuesListHomePath } from '../list/routing';
import { LIST_CAT_PARAM, parseListCatParam } from '../list/browseListUrlState';

export const MOBILE_FIVE_TAB_ORDER = ['trips', 'venues', 'crews', 'plan', 'chat'] as const;

export type MobileFiveTabId = (typeof MOBILE_FIVE_TAB_ORDER)[number];

export type MobileFiveTabProjection = 'map' | 'list';

/** Locked product defaults — change only with NAVIGATION.md + test updates. */
export const MOBILE_FIVE_TAB_DEFAULTS = {
  tripsDefaultProjection: 'map' satisfies MobileFiveTabProjection,
  venuesDefaultProjection: 'map' satisfies MobileFiveTabProjection,
  rememberProjectionPerTab: true,
  crewsUsesListPeopleDiscovery: true,
  /** Full-screen `/list` for mobile list mode (not `/explore?list=1` drawer as tab home). */
  listModePath: 'full-list' as const,
  clearScopeWhenSwitchingDiscoveryTabs: true,
  guestsSeeAllTabLabels: true,
  guestsGatedTabs: ['crews', 'plan', 'chat'] as const satisfies readonly MobileFiveTabId[],
} as const;

export const MOBILE_FIVE_TAB_UI_LABELS: Record<MobileFiveTabId, string> = {
  trips: 'Trips',
  venues: 'Venues',
  crews: 'Crews',
  plan: 'Plan',
  chat: 'Chat',
};

const SESSION_PROJECTION_KEY: Record<'trips' | 'venues', string> = {
  trips: 'uaetrail:nav.trips.projection',
  venues: 'uaetrail:nav.venues.projection',
};

export const readMobileFiveTabProjection = (tab: 'trips' | 'venues'): MobileFiveTabProjection => {
  if (!MOBILE_FIVE_TAB_DEFAULTS.rememberProjectionPerTab) {
    return tab === 'trips'
      ? MOBILE_FIVE_TAB_DEFAULTS.tripsDefaultProjection
      : MOBILE_FIVE_TAB_DEFAULTS.venuesDefaultProjection;
  }
  try {
    const raw = sessionStorage.getItem(SESSION_PROJECTION_KEY[tab]);
    if (raw === 'map' || raw === 'list') return raw;
  } catch {
    /* ignore */
  }
  return tab === 'trips'
    ? MOBILE_FIVE_TAB_DEFAULTS.tripsDefaultProjection
    : MOBILE_FIVE_TAB_DEFAULTS.venuesDefaultProjection;
};

export const writeMobileFiveTabProjection = (tab: 'trips' | 'venues', projection: MobileFiveTabProjection) => {
  if (!MOBILE_FIVE_TAB_DEFAULTS.rememberProjectionPerTab) return;
  try {
    sessionStorage.setItem(SESSION_PROJECTION_KEY[tab], projection);
  } catch {
    /* ignore */
  }
};

/** Default map entry for Trips tab (activities scope). */
export const tripsMapHomePath = (): string =>
  explorePath({ panel: 'activities', pinKind: 'activities' });

/** Default map entry for Venues tab. */
export const venuesMapHomePath = (): string => explorePath({ panel: 'venues', pinKind: 'places' });

/** Crews tab home — people discovery list (aliases to `/list?listCat=people`). */
export const crewsHomePath = (): string => listPeopleDiscoveryPath();

/** Tab tap target respecting remembered map/list projection (Trips/Venues only). */
export const mobileFiveTabHomePath = (tab: MobileFiveTabId): string => {
  switch (tab) {
    case 'trips':
      return readMobileFiveTabProjection('trips') === 'list' ? tripsListHomePath() : tripsMapHomePath();
    case 'venues':
      return readMobileFiveTabProjection('venues') === 'list' ? venuesListHomePath() : venuesMapHomePath();
    case 'crews':
      return crewsHomePath();
    case 'plan':
      return PLAN_PATH;
    case 'chat':
      return MESSAGES_PATH;
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
};

const EXPLORE_PEOPLE_VIEW_KEYS = new Set(['people', 'social', 'going']);

const exploreIsPeopleScope = (search: string): boolean => {
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const view = params.get('view');
  if (view && EXPLORE_PEOPLE_VIEW_KEYS.has(view)) return true;
  if (params.get('searchScope') === 'people') return true;
  return false;
};

const exploreIsVenuesScope = (search: string): boolean => {
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const panel = parseExplorePanel(params.get('panel'));
  if (panel === 'venues' || panel === 'shops') return true;
  const pinKind = parseExplorePinKindFilter(params.get('pinKind'));
  if (pinKind === 'places' || pinKind === 'shops') return true;
  return false;
};

/**
 * Which bottom-tab is active for mobile chrome highlight + back semantics.
 * Returns `null` on routes that are not a five-tab home (entity detail, threads, host console, …).
 */
export const resolveMobileFiveTab = (pathname: string, search = ''): MobileFiveTabId | null => {
  if (pathname === PLAN_PATH) return 'plan';
  if (pathname === MESSAGES_PATH || pathname === '/publishing/messages') {
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    if (params.get('to') || params.get('group')) return null;
    return 'chat';
  }

  if (pathname === LIST_DISCOVERY_PATH) {
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    const listCat = parseListCatParam(params.get(LIST_CAT_PARAM));
    if (listCat === 'people') return 'crews';
    if (listCat === 'venues') return 'venues';
    return 'trips';
  }

  if (pathname === EXPLORE_MAP_PATH) {
    if (exploreIsPeopleScope(search)) return 'crews';
    if (exploreIsVenuesScope(search)) return 'venues';
    return 'trips';
  }

  return null;
};

/** @deprecated Use {@link resolveMobileFiveTab} — old three-tab name. */
export const resolveMobileBottomNavTab = resolveMobileFiveTab;

export const isMobileFiveTabHomePath = (pathname: string, search: string): boolean =>
  resolveMobileFiveTab(pathname, search) != null;
