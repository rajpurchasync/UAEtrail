/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

import {
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  LEGACY_CONTRIBUTIONS_PATH,
  GROUPS_PATH,
  MEMBERSHIP_MARKETING_PATH,
  MESSAGES_PATH,
  MY_REQUESTS_PATH,
  NOTIFICATIONS_PATH,
  PROFILE_PATH,
  JOURNEY_MAP_PATH,
  PROFILE_HISTORY_PATH,
  MY_TRIPS_PATH,
  PLAN_PATH,
  TRIPS_PATH,
  ADMIN_PLACES_PATH,
  OPERATOR_PLACES_PATH,
  signUpPath,
} from './surfacePaths';
import { LEGACY_BECOME_HOST_PATH } from './memberRoutes';
import {
  GUIDE_PROFILE_PATH_PREFIX,
  LEGACY_OPERATOR_PROFILE_PATH_PREFIX,
} from '@uaetrail/shared-types';

export { ADMIN_PLACES_PATH, OPERATOR_PLACES_PATH };

/** Full-screen explore map (mobile-first). */
export const EXPLORE_MAP_PATH = '/explore' as const;

/** Visual discover browse embedded on explore (`browse=1` — categories, rails, posters). */
export const EXPLORE_DISCOVER_BROWSE_PATH = `${EXPLORE_MAP_PATH}?browse=1` as const;

/** Scroll-first discovery feed (mobile-first layout; desktop centered column). */
export const LIST_DISCOVERY_PATH = '/list' as const;

/** @deprecated Use {@link ADMIN_PLACES_PATH} */
export const ADMIN_LOCATIONS_PATH = ADMIN_PLACES_PATH;
/** @deprecated Use {@link OPERATOR_PLACES_PATH} */
export const HOST_LOCATIONS_PATH = OPERATOR_PLACES_PATH;

/**
 * Domain glossary — product language vs wire/storage names (Phase 1).
 * Use product names in UI, routes, and new code; legacy aliases remain for API compat.
 */
export const DOMAIN_GLOSSARY = {
  Place: {
    product: 'Place',
    description:
      'One map/catalog POI (trail, camp, shop, outdoor spot; future toilet, gas, …) — typed by PlaceKind; stored in locations.',
    storage: 'Location',
    api: '/places',
    legacyApi: '/locations',
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
    api: '/publishing (alias /operator), /tenants/:slug',
    consoleRoute: '/publishing/*',
    publicRoute: '/guide/:slug · /agency/:slug · /partner/:slug',
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

/** Post-auth destination for landing “Join” CTA. */
export const PARTICIPANT_JOIN_REDIRECT = EXPLORE_MAP_PATH;

/** Default brand profile segment when kind is unknown (guide storefront). */
export const ORGANISATION_PUBLIC_PATH_PREFIX = GUIDE_PROFILE_PATH_PREFIX;

/** Retired `/operator` — redirect only; do not link in new UI. */
export const LEGACY_OPERATOR_PUBLIC_PATH_PREFIX = LEGACY_OPERATOR_PROFILE_PATH_PREFIX;

/** @deprecated Use {@link LEGACY_OPERATOR_PUBLIC_PATH_PREFIX} */
export const OPERATOR_PUBLIC_PATH_PREFIX = LEGACY_OPERATOR_PUBLIC_PATH_PREFIX;

/** Desktop top nav — map-first; discover browse is hamburger-only. */
export const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: EXPLORE_MAP_PATH, label: 'Explore' },
  { to: '/faq', label: 'Help' },
] as const;

/** Sign-up URL with post-auth return path (Join free / create account). */
export const joinAuthPath = (
  redirect: string = PARTICIPANT_JOIN_REDIRECT,
  options?: { focus?: string; scrollY?: number }
): string => signUpPath({ redirect, focus: options?.focus, scrollY: options?.scrollY });

/** Right-side user menu on landing (mobile/PWA) — Explore, Join free, Contact (+ Log in in drawer). */
export const MOBILE_LANDING_USER_MENU = [
  { label: 'Explore', to: EXPLORE_MAP_PATH, match: [EXPLORE_MAP_PATH] as const },
  {
    label: 'Browse',
    to: EXPLORE_DISCOVER_BROWSE_PATH,
    match: [EXPLORE_DISCOVER_BROWSE_PATH, LIST_DISCOVERY_PATH, '/discovery'] as const,
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

/** Hamburger drawer — emoji labels; notifications live in the header bell. */
export const CONSUMER_HAMBURGER_MENU: readonly ConsumerHamburgerMenuItem[] = [
  {
    kind: 'link',
    label: 'Browse',
    emoji: '🧭',
    to: EXPLORE_DISCOVER_BROWSE_PATH,
    match: [EXPLORE_DISCOVER_BROWSE_PATH, LIST_DISCOVERY_PATH, '/discovery'],
  },
  {
    kind: 'link',
    label: 'History',
    emoji: '🧳',
    to: PROFILE_HISTORY_PATH,
    match: [PROFILE_HISTORY_PATH, JOURNEY_MAP_PATH, MY_TRIPS_PATH, '/trips', '/activities', '/activity'],
  },
  {
    kind: 'link',
    label: 'Chat',
    emoji: '💬',
    to: MESSAGES_PATH,
    match: [MESSAGES_PATH],
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
    kind: 'download',
    title: 'Download',
    items: [
      { label: 'Android', emoji: '🤖', action: 'pwa-android' },
      { label: 'iOS', emoji: '🍎', action: 'pwa-ios' },
    ],
  },
];

/**
 * User taxonomy (admin + product):
 * - Participant (visitor): mobile app experience only — no sidebar dashboard
 * - Business / Guide Organizer: tenant_owner with COMPANY or GUIDE_OWNED tenant
 * - Organizer Staff: tenant_admin, tenant_guide
 * - Platform Admin: full admin console
 * Accounts are ACTIVE on signup/OAuth; organizer tenants may still require approval.
 */

/** Feature toggles — flip without redeploying copy in many files. */
export const FEATURE_FLAGS = {
  /** Premium subscription checkout — keep false until launch. */
  membershipEnabled: false,
  /** Gear shop catalog — live on this experiment branch so shops can appear on the map. */
  shopComingSoon: false,
  /** In-app Stripe checkout — disabled; shops use outbound affiliate links. */
  shopCheckoutEnabled: false,
} as const;

export const MEMBERSHIP_NAV_LINK = FEATURE_FLAGS.membershipEnabled
  ? ({ to: MEMBERSHIP_MARKETING_PATH, label: 'Membership' })
  : null;

/** Shop: catalog, cart, and Stripe checkout (when configured). */
export const SHOP_V1 = {
  memberDiscountPercent: 10,
  showMemberBadge: FEATURE_FLAGS.membershipEnabled,
  /** UAE standard VAT rate — shown in cart and added at checkout. */
  vatPercent: 5,
  vatEnabled: true,
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
 * Map provider for Explore (Phase 2).
 * Esri light-gray base + reference labels — free, no API key, English place names.
 */
const readEnvTileUrl = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const envTileUrl = readEnvTileUrl(import.meta.env.VITE_MAP_TILE_URL);
const envLabelTileUrl = readEnvTileUrl(import.meta.env.VITE_MAP_LABEL_TILE_URL);

export const MAP_CONFIG = {
  provider: 'esri' as const,
  defaultCenter: { lat: 24.4539, lng: 54.3773 },
  defaultZoom: 8,
  /** Explore browse — upper UAE / Emirates overview (not city street zoom). */
  exploreDefaultCenter: { lat: 25.42, lng: 55.72 },
  exploreDefaultZoom: 8,
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
  /** Explore map style presets (satellite vs street map). */
  exploreStyles: {
    satellite: {
      tileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      labelTileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    },
    map: {
      tileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      labelTileUrl: null,
    },
  },
  /** Explore allows wider zoom-out than detail maps (GCC / regional context). */
  exploreMinZoom: 5,
} as const;

export type ExploreMapStyle = 'satellite' | 'map';

export const EXPLORE_MAP_STYLE_STORAGE_KEY = 'uaetrail-explore-map-style';

export const readExploreMapStyle = (): ExploreMapStyle => {
  if (typeof window === 'undefined') return 'satellite';
  const stored = window.localStorage.getItem(EXPLORE_MAP_STYLE_STORAGE_KEY);
  return stored === 'map' ? 'map' : 'satellite';
};

export const getExploreMapTiles = (style: ExploreMapStyle) => {
  if (envTileUrl) {
    return {
      tileUrl: envTileUrl,
      labelTileUrl: envLabelTileUrl ?? null,
    };
  }
  return MAP_CONFIG.exploreStyles[style];
};

/** Routes where bottom nav, footer padding, and mobile chrome are hidden. */
const CONSUMER_CHROME_HIDDEN_PREFIXES = [
  '/admin',
  '/operator',
  '/host',
  '/organizer',
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

/** Mobile detail pages render their own back header (activity, trail, camp, product). */
export const isMobileDetailRoute = (pathname: string): boolean =>
  /^\/(trail|camp|venue|event|product|activity|event-spot|community-activity)\//.test(pathname);

/** Public entity detail — own header + sticky CTA; no global marketing `Footer`. */
export const isConsumerEntityDetailRoute = (pathname: string): boolean =>
  isMobileDetailRoute(pathname) ||
  pathname.startsWith('/area/') ||
  /^\/shop\/[^/]+/.test(pathname) ||
  pathname.startsWith('/guide/') ||
  pathname.startsWith('/agency/') ||
  pathname.startsWith('/partner/');

/**
 * Dark site footer (social + legal links). Hidden on map tabs (bottom nav) and entity detail pages.
 */
export const shouldShowMarketingSiteFooter = (
  pathname: string,
  options: { showConsumerChrome: boolean; showMobileBottomNav: boolean }
): boolean => {
  if (!options.showConsumerChrome) return false;
  if (options.showMobileBottomNav) return false;
  if (isConsumerEntityDetailRoute(pathname)) return false;
  return true;
};

/**
 * Consumer pages that render their own sticky header (ConsumerShell / MobileScreen / MobileDetailShell).
 * Layout must not also show MobileConsumerNavBar on these routes.
 */
export const CONSUMER_SELF_HEADER_EXACT = [
  '/',
  '/explore',
  LIST_DISCOVERY_PATH,
  PLAN_PATH,
  '/trips',
  '/trips/map',
  '/activities',
  PROFILE_HISTORY_PATH,
  JOURNEY_MAP_PATH,
  MY_TRIPS_PATH,
  '/shop',
  PROFILE_PATH,
  GROUPS_PATH,
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  LEGACY_CONTRIBUTIONS_PATH,
  MESSAGES_PATH,
  NOTIFICATIONS_PATH,
  MY_REQUESTS_PATH,
  LEGACY_BECOME_HOST_PATH,
  '/profile/pro-membership',
  '/become-organizer',
  '/faq',
  '/terms',
  '/privacy',
  '/security-privacy',
] as const;

export const CONSUMER_SELF_HEADER_PREFIXES = [
  '/profile/',
  '/my-requests/',
  '/member/',
  '/guide/',
  '/agency/',
  '/partner/',
  '/venue/',
  '/operator/',
  '/publishing/',
  '/organisation/manage',
  '/shop/manage',
  '/agency/manage',
  '/operator/security-privacy',
  '/publishing/security-privacy',
] as const;

export const hasConsumerSelfHeader = (pathname: string): boolean =>
  CONSUMER_SELF_HEADER_EXACT.includes(pathname as (typeof CONSUMER_SELF_HEADER_EXACT)[number]) ||
  CONSUMER_SELF_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  isMobileDetailRoute(pathname);

/** Signed-in mobile tab shell — Explore · My Plans · Chat (middle tab route {@link PLAN_PATH}). */
export const MOBILE_BOTTOM_NAV_TAB_PATHS = [EXPLORE_MAP_PATH, PLAN_PATH, MESSAGES_PATH] as const;

export type MobileBottomNavTabPath = (typeof MOBILE_BOTTOM_NAV_TAB_PATHS)[number];

export const isMobileBottomNavTabPath = (pathname: string): pathname is MobileBottomNavTabPath =>
  (MOBILE_BOTTOM_NAV_TAB_PATHS as readonly string[]).includes(pathname) ||
  pathname === '/activities' ||
  pathname === TRIPS_PATH ||
  pathname === LIST_DISCOVERY_PATH;

/** Personal hub routes that keep the mobile tab bar visible (profile is not a tab). */
export const MOBILE_BOTTOM_NAV_PROFILE_PATHS = [
  PROFILE_PATH,
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  LEGACY_CONTRIBUTIONS_PATH,
  GROUPS_PATH,
  MY_REQUESTS_PATH,
] as const;

const MOBILE_BOTTOM_NAV_PROFILE_PREFIXES = ['/profile/'] as const;

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
  if (pathname === MESSAGES_PATH || pathname === '/operator/messages' || pathname === '/publishing/messages') {
    const params = new URLSearchParams(search);
    if (params.get('to') || params.get('group')) return false;
  }
  if (!signedIn) return isMobileBottomNavTabPath(pathname);
  if (isMobileBottomNavTabPath(pathname)) return true;
  if (isMobileBottomNavProfilePath(pathname)) return true;
  return false;
};
