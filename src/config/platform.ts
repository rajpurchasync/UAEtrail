/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

import {
  BUDDIES_PATH,
  PROFILE_SUBMISSIONS_PATH,
  INBOUND_CONTRIBUTIONS_PATH,
  OPERATOR_CONSOLE_PREFIX,
  GROUPS_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  PROFILE_PATH,
  JOURNEY_MAP_PATH,
  PROFILE_HISTORY_PATH,
  HOSTING_HUB_PATH,
  OPERATOR_OVERVIEW_PATH,
  PLAN_PATH,
  PLAN_TODAY_PATH,
  PROFILE_SETTINGS_PATH,
  isAppSettingsPath,
  isNotificationHubPath,
  ADMIN_PLACES_PATH,
  OPERATOR_PLACES_PATH,
  signUpPath,
} from './surfacePaths';
import { INBOUND_BECOME_HOST_PATH, PRO_MEMBERSHIP_PATH } from './memberRoutes';
import {
  INBOUND_BECOME_ORGANIZER_PATH,
  INBOUND_RETIRED_CONSOLE_PREFIXES,
} from './inboundRoutePaths';
import { SETTINGS_SURFACE_TITLE } from './settingsHub';
import { AGENCY_PROFILE_PATH_PREFIX } from '@uaetrail/shared-types';
import { PRODUCT_CREWS_TAB_LABEL } from '../content/productNorthStar';
import { resolveEsriExploreStylePreset, resolveExploreMapTiles } from '../explore/exploreMapBasemap';
import type { ExploreMapStyle } from '../explore/exploreMapBasemap';

export type { ExploreMapStyle, ExploreMapTileSet } from '../explore/exploreMapBasemap';
export { resolveExploreMapTiles } from '../explore/exploreMapBasemap';

export {
  ADMIN_PLACES_PATH,
  OPERATOR_PLACES_PATH,
  AGENCY_PROFILE_PATH_PREFIX,
};

/** Full-screen explore map (mobile-first). */
export const EXPLORE_MAP_PATH = '/explore' as const;

/**
 * Guest website SearchAction target. Must stay equal to `explorePlacesPath()` with no options
 * so the home page does not import explore routing.
 */
export const EXPLORE_PLACES_SEARCH_PATH = `${EXPLORE_MAP_PATH}?panel=venues` as const;

/** Visual discover browse embedded on explore (`browse=1` — categories, rails, posters). */
export const EXPLORE_DISCOVER_BROWSE_PATH = `${EXPLORE_MAP_PATH}?browse=1` as const;

/** Scroll-first discovery feed (mobile-first layout; desktop centered column). */
export const LIST_DISCOVERY_PATH = '/list' as const;

/** Drawer / landing list entry paths (aligned with `tripsListHomePath` / `venuesListHomePath` scoping). */
export const TRIPS_LIST_NAV_PATH = `${LIST_DISCOVERY_PATH}?listCat=activities` as const;
export const VENUES_LIST_NAV_PATH = `${LIST_DISCOVERY_PATH}?listCat=venues` as const;
/** Crews tab list home (`listPeopleDiscoveryPath` minimal). */
export const CREWS_LIST_NAV_PATH = `${LIST_DISCOVERY_PATH}?listCat=people` as const;

/**
 * Domain glossary — product language vs wire/storage names (Phase 1).
 * Use product names in UI, routes, and new code; inbound HTTP aliases remain for bookmarks.
 */
export const DOMAIN_GLOSSARY = {
  Place: {
    product: 'Place',
    description:
      'One map/catalog POI (trail, camp, shop, outdoor spot; future toilet, gas, …) — typed by PlaceKind; stored in locations.',
    storage: 'Location',
    api: '/places',
    inboundApiPath: '/locations',
    publicRoutes: ['/trail/:id', '/camp/:id', '/venue/:id', '/shop/:id'],
    adminRoute: ADMIN_PLACES_PATH,
    hostRoute: OPERATOR_PLACES_PATH,
  },
  Activity: {
    product: 'Activity',
    description: 'Scheduled listing at a place (hike, camp trip, event, rideshare).',
    storage: 'Activity',
    api: '/activities',
    publicRoute: '/activity/:id',
  },
  Organisation: {
    product: 'Organisation',
    description: 'Host tenant — guide, agency, partner, or shop brand profiles.',
    storage: 'Tenant',
    api: '/publishing, /tenants/:slug',
    consoleRoute: '/operator/*',
    publicRoute: '/agency/:slug · /partner/:slug · /member/:userId (individuals)',
    manageRoute: '/organisation/manage',
  },
  Shop: {
    product: 'Shop',
    description: 'Merchant storefront and catalog.',
    storage: 'MerchantProfile',
    api: '/shop',
    publicRoute: '/shop/:id',
  },
  Participant: {
    product: 'Participant',
    description: 'End-user explorer role.',
    storage: 'User.role = participant',
    note: 'Admin UI may say "Member"; social graph uses "Buddy".',
  },
} as const;

/** Desktop top nav — map-first; discover browse is hamburger-only. */
export const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: EXPLORE_MAP_PATH, label: 'Explore' },
  { to: '/faq', label: 'Help' },
] as const;

/** Sign-up URL with post-auth return path (Join free / create account). */
export const joinAuthPath = (
  redirect: string = EXPLORE_MAP_PATH,
  options?: { focus?: string; scrollY?: number }
): string => signUpPath({ redirect, focus: options?.focus, scrollY: options?.scrollY });

/** Right-side user menu on landing (mobile/PWA) — Explore, Trips, Venues, Join free, Contact. */
export const MOBILE_LANDING_USER_MENU = [
  { label: 'Explore', to: EXPLORE_MAP_PATH, match: [EXPLORE_MAP_PATH] as const },
  {
    label: 'Trips',
    to: TRIPS_LIST_NAV_PATH,
    match: [LIST_DISCOVERY_PATH, EXPLORE_DISCOVER_BROWSE_PATH, '/discovery'] as const,
  },
  {
    label: 'Places',
    to: VENUES_LIST_NAV_PATH,
    match: [LIST_DISCOVERY_PATH, EXPLORE_MAP_PATH, '/discovery'] as const,
  },
  { label: 'Join free', to: joinAuthPath(), match: ['/signin', '/signup'] as const },
  { label: 'Contact', href: 'mailto:support@uaetrail.com' },
] as const;

export type ConsumerHamburgerMenuItem =
  | {
      kind: 'link';
      label: string;
      emoji: string;
      to: string;
      match: readonly string[];
      /** Guests → sign-in with return to `to`. */
      authGate?: true;
      profileLink?: true;
      labelGuest?: string;
      emojiGuest?: string;
    }
  | {
      kind: 'download';
      title: string;
      items: readonly {
        label: string;
        emoji: string;
        action: 'pwa-android' | 'pwa-ios';
      }[];
    };

/**
 * Signed-in hamburger — same five tabs as `MobileBottomNav`, then Profile · Settings · Install.
 * Trip/Venue/Crews/Plans/Chat `to` fallbacks; `MobileMenu` resolves via `mobileFiveTabHomePath`.
 */
export const CONSUMER_HAMBURGER_MENU: readonly ConsumerHamburgerMenuItem[] = [
  {
    kind: 'link',
    label: 'Trips',
    emoji: '🥾',
    to: TRIPS_LIST_NAV_PATH,
    match: [EXPLORE_DISCOVER_BROWSE_PATH, LIST_DISCOVERY_PATH, EXPLORE_MAP_PATH, '/discovery'],
  },
  {
    kind: 'link',
    label: 'Places',
    emoji: '📍',
    to: VENUES_LIST_NAV_PATH,
    match: [LIST_DISCOVERY_PATH, EXPLORE_MAP_PATH, '/discovery'],
  },
  {
    kind: 'link',
    label: 'Plans',
    emoji: '📅',
    to: PLAN_PATH,
    match: [PLAN_PATH],
    authGate: true,
  },
  {
    kind: 'link',
    label: PRODUCT_CREWS_TAB_LABEL,
    emoji: '👥',
    to: CREWS_LIST_NAV_PATH,
    match: [LIST_DISCOVERY_PATH, EXPLORE_MAP_PATH],
    authGate: true,
  },
  {
    kind: 'link',
    label: 'Chat',
    emoji: '💬',
    to: MESSAGES_PATH,
    match: [MESSAGES_PATH, '/operator/messages', '/publishing/messages'],
    authGate: true,
  },
  {
    kind: 'link',
    label: 'Profile',
    labelGuest: 'Sign in',
    emoji: '👤',
    emojiGuest: '👤',
    to: PROFILE_PATH,
    match: [PROFILE_PATH, MY_REQUESTS_PATH, '/signin', '/signup'],
    profileLink: true,
  },
  {
    kind: 'link',
    label: SETTINGS_SURFACE_TITLE,
    emoji: '⚙️',
    to: PROFILE_SETTINGS_PATH,
    match: [PROFILE_SETTINGS_PATH],
  },
  {
    kind: 'download',
    title: 'Install app',
    items: [
      { label: 'Android', emoji: '🤖', action: 'pwa-android' },
      { label: 'iOS', emoji: '🍎', action: 'pwa-ios' },
    ],
  },
];

/** @deprecated Host-mode drawer retired — same consumer menu for all roles (PCO-14). */
export const hostModeHamburgerMenu = (_hostingHubPath?: string): readonly ConsumerHamburgerMenuItem[] =>
  CONSUMER_HAMBURGER_MENU;

/**
 * User taxonomy (admin + product):
 * - Participant (visitor): mobile app experience only — no sidebar dashboard
 * - Business / Guide publisher: tenant_owner with COMPANY or GUIDE_OWNED tenant
 * - Publisher staff: tenant_admin, tenant_guide
 * - Platform Admin: full admin console
 * Accounts are ACTIVE on signup/OAuth; publisher tenants may still require approval.
 */

const readCommunityDiscoverFlag = (): boolean =>
  (import.meta.env.VITE_COMMUNITY_DISCOVER as string | undefined)?.trim() === '1';

/** Feature toggles — flip without redeploying copy in many files. */
export const FEATURE_FLAGS = {
  /** Premium subscription checkout — keep false until launch. */
  membershipEnabled: false,
  /** Gear shops on explore map — profile + outbound links only (no catalog). */
  shopComingSoon: false,
  /** Discoverable clubs in Find crew → Community (`MIG-COMMUNITY-DISCOVER`). Set `VITE_COMMUNITY_DISCOVER=1` locally. */
  communityDiscover: readCommunityDiscoverFlag(),
} as const;

export const MEMBERSHIP_NAV_LINK = FEATURE_FLAGS.membershipEnabled
  ? ({ to: PRO_MEMBERSHIP_PATH, label: 'Pro membership' })
  : null;

/** Shop profile surface — member badge hook when membership launches. */
export const SHOP_V1 = {
  memberDiscountPercent: 10,
  showMemberBadge: FEATURE_FLAGS.membershipEnabled,
  vatPercent: 5,
  vatEnabled: false,
};

/**
 * Pre-join participant visibility: show first name + avatar + count.
 * Full contact details only after approval.
 */
export const PARTICIPANT_PRIVACY = {
  showPreJoin: true,
  showDisplayName: true,
  showAvatar: true,
  showEmail: false,
  maxPreviewCount: 8,
};

/**
 * Map tiles — detail embeds default to Esri light gray; Explore uses `resolveExploreMapTiles`
 * (MapTiler Outdoor when `VITE_MAPTILER_API_KEY` is set, else Esri). See `exploreMapBasemap.ts`.
 */
const readEnvTileUrl = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const envTileUrl = readEnvTileUrl(import.meta.env.VITE_MAP_TILE_URL);
const envLabelTileUrl = readEnvTileUrl(import.meta.env.VITE_MAP_LABEL_TILE_URL);

export const MAP_CONFIG = {
  /** Detail / picker embeds without an explore provider key. */
  provider: 'esri' as const,
  defaultCenter: { lat: 24.4539, lng: 54.3773 },
  defaultZoom: 8,
  /** Explore browse — UAE emirates framing (not GCC / country overview). */
  exploreDefaultCenter: { lat: 25.42, lng: 55.72 },
  exploreDefaultZoom: 9,
  /** “Locate me” on Explore — street-level framing (never zoom out from current view). */
  exploreLocateZoom: 15,
  /** Explore / detail maps — light base + label overlay. */
  tileUrl:
    envTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  labelTileUrl:
    envLabelTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  /**
   * Mobile explore — satellite base with place labels (rich terrain, works well in UAE).
   * Override with VITE_MAP_TILE_URL / VITE_MAP_LABEL_TILE_URL.
   */
  exploreTileUrl:
    envTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  exploreLabelTileUrl:
    envLabelTileUrl ??
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  exploreTileAttribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, TomTom, Garmin, FAO, NOAA, USGS',
  tileAttribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, TomTom, Garmin, FAO, NOAA, USGS',
  /** Esri-only explore presets (when no MapTiler/Mapbox key). */
  exploreStyles: {
    satellite: resolveEsriExploreStylePreset('satellite'),
    map: resolveEsriExploreStylePreset('map'),
  },
  /** Explore — do not zoom out past emirate-level (keeps map readable on Trips). */
  exploreMinZoom: 8,
} as const;

export const EXPLORE_MAP_STYLE_STORAGE_KEY = 'uaetrail-explore-map-style';

export const readExploreMapStyle = (): ExploreMapStyle => {
  if (typeof window === 'undefined') return 'satellite';
  const stored = window.localStorage.getItem(EXPLORE_MAP_STYLE_STORAGE_KEY);
  return stored === 'map' ? 'map' : 'satellite';
};

/** Explore map tiles + attribution for the current style toggle. */
export const getExploreMapTiles = (style: ExploreMapStyle) => resolveExploreMapTiles(style);

/** Routes where bottom nav, footer padding, and mobile chrome are hidden. */
const CONSUMER_CHROME_HIDDEN_PREFIXES = [
  '/admin',
  OPERATOR_CONSOLE_PREFIX,
  ...INBOUND_RETIRED_CONSOLE_PREFIXES,
  '/dashboard',
] as const;

const CONSUMER_CHROME_HIDDEN_EXACT = [
  '/signin',
  '/signup',
  '/verify',
  '/welcome',
  '/onboarding',
  '/forgot-password'
] as const;

export const isConsumerChromeHidden = (pathname: string): boolean =>
  CONSUMER_CHROME_HIDDEN_EXACT.includes(pathname as (typeof CONSUMER_CHROME_HIDDEN_EXACT)[number]) ||
  CONSUMER_CHROME_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

/** Mobile detail pages render their own back header (activity, trail, camp, place, facility, …). */
export const isMobileDetailRoute = (pathname: string): boolean =>
  /^\/(trail|camp|venue|event|product|activity|event-spot|community-activity|place|facility)\//.test(
    pathname
  );

/** Public entity detail — own header + sticky CTA (MobileDetailShell). */
export const isEntityDetailRoute = (pathname: string): boolean =>
  isMobileDetailRoute(pathname) ||
  pathname.startsWith('/area/') ||
  pathname === '/geo' ||
  pathname.startsWith('/geo/') ||
  pathname === '/plan/today' ||
  /^\/shop\/[^/]+/.test(pathname) ||
  pathname.startsWith('/agency/') ||
  pathname.startsWith('/partner/');


/**
 * Product pages that render their own sticky header (ProductShell / MobileScreen / MobileDetailShell).
 * Layout must not stack a second layout header (unified tab header) on these routes.
 */
export const CONSUMER_SELF_HEADER_EXACT = [
  '/',
  '/explore',
  LIST_DISCOVERY_PATH,
  PLAN_PATH,
  HOSTING_HUB_PATH,
  PLAN_TODAY_PATH,
  PROFILE_HISTORY_PATH,
  JOURNEY_MAP_PATH,
  '/shop',
  PROFILE_PATH,
  GROUPS_PATH,
  BUDDIES_PATH,
  PROFILE_SUBMISSIONS_PATH,
  INBOUND_CONTRIBUTIONS_PATH,
  OPERATOR_CONSOLE_PREFIX,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  INBOUND_BECOME_HOST_PATH,
  INBOUND_BECOME_ORGANIZER_PATH,
  '/profile/pro-membership',
  '/faq',
  '/terms',
  '/privacy',
  '/security-privacy',
  '/about',
  '/contact',
  '/sitemap',
  '/explore/search',
] as const;

export const CONSUMER_SELF_HEADER_PREFIXES = [
  '/profile/',
  '/my-requests/',
  '/member/',
  '/agency/',
  '/partner/',
  '/venue/',
  '/operator/',
  '/organisation/manage',
  '/shop/manage',
  '/agency/manage',
  '/operator/security-privacy',
] as const;

export const hasConsumerSelfHeader = (pathname: string): boolean =>
  CONSUMER_SELF_HEADER_EXACT.includes(pathname as (typeof CONSUMER_SELF_HEADER_EXACT)[number]) ||
  CONSUMER_SELF_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  isAppSettingsPath(pathname) ||
  isNotificationHubPath(pathname) ||
  isMobileDetailRoute(pathname);

/** Profile stack + help pages — inject hamburger in ConsumerShell when Layout tab header is absent. */
export const shouldShowProductShellHamburger = (pathname: string): boolean => {
  if (isConsumerChromeHidden(pathname)) return false;
  if (isEntityDetailRoute(pathname)) return false;
  if (pathname.startsWith('/member/')) return false;
  if (
    pathname === EXPLORE_MAP_PATH ||
    pathname === LIST_DISCOVERY_PATH ||
    pathname === '/explore/search'
  ) {
    return false;
  }
  if (
    pathname === '/profile' ||
    pathname === PLAN_PATH ||
    pathname === HOSTING_HUB_PATH ||
    pathname === MESSAGES_PATH
  ) {
    return false;
  }
  if (pathname === PROFILE_HISTORY_PATH || pathname === JOURNEY_MAP_PATH) return false;
  if (pathname.startsWith('/profile/') || pathname === '/settings' || pathname.startsWith('/settings/')) return true;
  if (pathname === '/faq' || pathname === '/terms' || pathname === '/privacy') return true;
  if ((MOBILE_BOTTOM_NAV_PROFILE_PATHS as readonly string[]).includes(pathname)) return true;
  return MOBILE_BOTTOM_NAV_PROFILE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};


/**
 * Route pathnames that host the five-tab mobile shell (Trips/Venues share `/explore` + `/list`).
 * Tab labels: `MOBILE_FIVE_TAB_UI_LABELS` in `src/config/mobileFiveTabNav.ts`.
 */
export const MOBILE_BOTTOM_NAV_TAB_PATHS = [
  EXPLORE_MAP_PATH,
  LIST_DISCOVERY_PATH,
  PLAN_PATH,
  MESSAGES_PATH,
] as const;

export type MobileBottomNavTabPath = (typeof MOBILE_BOTTOM_NAV_TAB_PATHS)[number];

export const isMobileBottomNavTabPath = (pathname: string): pathname is MobileBottomNavTabPath =>
  (MOBILE_BOTTOM_NAV_TAB_PATHS as readonly string[]).includes(pathname);

/** Personal hub routes that keep the mobile tab bar visible (profile is not a tab). */
export const MOBILE_BOTTOM_NAV_PROFILE_PATHS = [
  PROFILE_PATH,
  BUDDIES_PATH,
  PROFILE_SUBMISSIONS_PATH,
  INBOUND_CONTRIBUTIONS_PATH,
  OPERATOR_CONSOLE_PREFIX,
  HOSTING_HUB_PATH,
  GROUPS_PATH,
  MY_REQUESTS_PATH,
] as const;

const MOBILE_BOTTOM_NAV_PROFILE_PREFIXES = ['/profile/', '/settings'] as const;

const isMobileBottomNavProfilePath = (pathname: string): boolean =>
  (MOBILE_BOTTOM_NAV_PROFILE_PATHS as readonly string[]).includes(pathname) ||
  MOBILE_BOTTOM_NAV_PROFILE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

/** Mobile bottom nav — map tab for everyone; other tabs + profile when signed in. */
export const shouldShowMobileBottomNav = (
  pathname: string,
  search: string,
  signedIn: boolean
): boolean => {
  if (isConsumerChromeHidden(pathname)) return false;
  if (pathname === EXPLORE_MAP_PATH) {
    const params = new URLSearchParams(search);
    if (params.get('list') === '1') return false;
  }
  if (pathname === '/explore/search') {
    return true;
  }
  if (pathname === MESSAGES_PATH || pathname === '/operator/messages' || pathname === '/publishing/messages') {
    const params = new URLSearchParams(search);
    if (params.get('to') || params.get('group')) return false;
  }
  if (!signedIn) return isMobileBottomNavTabPath(pathname);
  if (isMobileBottomNavTabPath(pathname)) return true;
  if (isMobileBottomNavProfilePath(pathname)) return true;
  return false;
};
