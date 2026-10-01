/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Full-screen explore map (mobile-first). */
export const EXPLORE_MAP_PATH = '/explore' as const;

/** Admin console — places (trails, camps, event venues). */
export const ADMIN_PLACES_PATH = '/admin/places' as const;
/** Host console — organisation place submissions. */
export const HOST_PLACES_PATH = '/host/places' as const;

/** @deprecated Use {@link ADMIN_PLACES_PATH} */
export const ADMIN_LOCATIONS_PATH = ADMIN_PLACES_PATH;
/** @deprecated Use {@link HOST_PLACES_PATH} */
export const HOST_LOCATIONS_PATH = HOST_PLACES_PATH;

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
    publicRoutes: ['/trail/:id', '/camp/:id', '/event/:id', '/shop/:id'],
    adminRoute: ADMIN_PLACES_PATH,
    hostRoute: HOST_PLACES_PATH,
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
    description: 'Host tenant — agency (guides) or shop operator.',
    storage: 'Tenant',
    api: '/host, /tenants/:slug',
    consoleRoute: '/host/*',
    publicRoute: '/operator/:slug',
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

export const ORGANISATION_PUBLIC_PATH_PREFIX = '/operator' as const;

/** @deprecated Use {@link ORGANISATION_PUBLIC_PATH_PREFIX} */
export const OPERATOR_PUBLIC_PATH_PREFIX = ORGANISATION_PUBLIC_PATH_PREFIX;

/** Desktop top nav — map-first; browse pages redirect into explore. */
export const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: EXPLORE_MAP_PATH, label: 'Explore' },
  { to: '/community', label: 'Community' },
  { to: '/faq', label: 'Help' },
] as const;

/** Sign-up URL with post-auth return path (Join free / create account). */
export const joinAuthPath = (redirect: string = PARTICIPANT_JOIN_REDIRECT): string =>
  `/signup?redirect=${encodeURIComponent(redirect)}`;

/** Right-side user menu on landing (mobile/PWA) — Explore, Join, Contact only. */
export const MOBILE_LANDING_USER_MENU = [
  { label: 'Explore', to: EXPLORE_MAP_PATH, match: [EXPLORE_MAP_PATH] as const },
  { label: 'Join', to: joinAuthPath(), match: ['/signin', '/signup'] as const },
  { label: 'Contact', href: 'mailto:support@uaetrail.com' },
] as const;

/** Right-side hamburger drawer order (mobile/PWA only). */
export const MOBILE_DRAWER_MENU = [
  {
    label: 'My Profile',
    to: '/profile',
    match: ['/profile', '/my-requests', '/messages'],
    profileLink: true,
  },
  { label: 'Explore', to: EXPLORE_MAP_PATH, match: [EXPLORE_MAP_PATH, '/discovery'] },
  { label: 'Notifications', to: '/notifications', match: ['/notifications'] },
  { label: 'My trips', to: '/trips', match: ['/trips', '/activities', '/activity'] },
] as const;

/**
 * User taxonomy (admin + product):
 * - Participant (visitor): mobile app experience only — no sidebar dashboard
 * - Business / Guide Organizer: tenant_owner with COMPANY or GUIDE_OWNED tenant
 * - Organizer Staff: tenant_admin, tenant_guide
 * - Platform Admin: full admin console
 * Accounts are ACTIVE on signup/OAuth; organizer tenants may still require approval.
 */

/** Community MVP: location-anchored Q&A, activity reports, and photo posts — not a generic forum. */
export const COMMUNITY_CATEGORIES = [
  { id: 'questions', label: 'Questions' },
  { id: 'activity-reports', label: 'Activity reports' },
  { id: 'photos', label: 'Photos' },
  { id: 'tips', label: 'Tips & Gear' },
] as const;

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
  ? ({ to: '/membership' as const, label: 'Membership' })
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
const envTileUrl =
  typeof import.meta.env.VITE_MAP_TILE_URL === 'string' ? import.meta.env.VITE_MAP_TILE_URL : undefined;
const envLabelTileUrl =
  typeof import.meta.env.VITE_MAP_LABEL_TILE_URL === 'string'
    ? import.meta.env.VITE_MAP_LABEL_TILE_URL
    : undefined;

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
  /^\/(trail|camp|event|product|activity|event-spot|community-activity)\//.test(pathname);

/**
 * Consumer pages that render their own sticky header (ConsumerShell / MobileScreen / MobileDetailShell).
 * Layout must not also show MobileConsumerNavBar on these routes.
 */
export const CONSUMER_SELF_HEADER_EXACT = [
  '/',
  '/explore',
  '/trips',
  '/trips/map',
  '/activities',
  '/community',
  '/shop',
  '/profile',
  '/groups',
  '/buddies',
  '/contributions',
  '/messages',
  '/notifications',
  '/my-requests',
  '/become-host',
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
  '/operator/',
  '/organisation/manage',
  '/shop/manage',
  '/agency/manage',
  '/host/security-privacy',
] as const;

export const hasConsumerSelfHeader = (pathname: string): boolean =>
  CONSUMER_SELF_HEADER_EXACT.includes(pathname as (typeof CONSUMER_SELF_HEADER_EXACT)[number]) ||
  CONSUMER_SELF_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  isMobileDetailRoute(pathname);

/** Signed-in mobile tab shell — Map · Activities · Messages. */
export const MOBILE_BOTTOM_NAV_TAB_PATHS = [EXPLORE_MAP_PATH, '/trips', '/messages'] as const;

export type MobileBottomNavTabPath = (typeof MOBILE_BOTTOM_NAV_TAB_PATHS)[number];

export const isMobileBottomNavTabPath = (pathname: string): pathname is MobileBottomNavTabPath =>
  (MOBILE_BOTTOM_NAV_TAB_PATHS as readonly string[]).includes(pathname) || pathname === '/activities';

/** Personal hub routes that keep the mobile tab bar visible (profile is not a tab). */
export const MOBILE_BOTTOM_NAV_PROFILE_PATHS = [
  '/profile',
  '/buddies',
  '/contributions',
  '/groups',
  '/my-requests',
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
  if (pathname === '/messages' && new URLSearchParams(search).get('to')) return false;
  if (!signedIn) return isMobileBottomNavTabPath(pathname);
  if (isMobileBottomNavTabPath(pathname)) return true;
  if (isMobileBottomNavProfilePath(pathname)) return true;
  return false;
};
