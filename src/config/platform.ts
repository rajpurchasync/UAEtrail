/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Full-screen explore map (mobile-first). */
export const EXPLORE_MAP_PATH = '/explore' as const;

/** Post-auth destination for landing “Join” CTA. */
export const PARTICIPANT_JOIN_REDIRECT = `${EXPLORE_MAP_PATH}?list=1` as const;

/** Desktop top nav — map-first; browse pages redirect into explore. */
export const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: EXPLORE_MAP_PATH, label: 'Explore' },
  { to: '/community', label: 'Community' },
  { to: '/faq', label: 'Help' },
] as const;

export const joinAuthPath = (redirect: string = PARTICIPANT_JOIN_REDIRECT): string =>
  `/signin?redirect=${encodeURIComponent(redirect)}`;

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
  { label: 'Explore Map', to: EXPLORE_MAP_PATH, match: [EXPLORE_MAP_PATH, '/discovery'] },
  { label: 'Notifications', to: '/notifications', match: ['/notifications'] },
  { label: 'My trips', to: '/activities?tab=joined', match: ['/activities', '/trips', '/trip', '/activity'] },
] as const;

/**
 * User taxonomy (admin + product):
 * - Participant (visitor): mobile app experience only — no sidebar dashboard
 * - Business / Guide Organizer: tenant_owner with COMPANY or GUIDE_OWNED tenant
 * - Organizer Staff: tenant_admin, tenant_guide
 * - Platform Admin: full admin console
 * Accounts are ACTIVE on signup/OAuth; organizer tenants may still require approval.
 */

/** Community MVP: location-anchored Q&A, trip reports, and photo posts — not a generic forum. */
export const COMMUNITY_CATEGORIES = [
  { id: 'questions', label: 'Questions' },
  { id: 'trip-reports', label: 'Trip Reports' },
  { id: 'photos', label: 'Photos' },
  { id: 'tips', label: 'Tips & Gear' },
] as const;

/** Feature toggles — flip without redeploying copy in many files. */
export const FEATURE_FLAGS = {
  /** Premium subscription checkout — keep false until launch. */
  membershipEnabled: false,
  /** Gear shop catalog — live on this experiment branch so shops can appear on the map. */
  shopComingSoon: false,
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
  /** Mobile explore — start on Dubai metro at city zoom. */
  exploreDefaultCenter: { lat: 25.2048, lng: 55.2708 },
  exploreDefaultZoom: 11,
  /** Explore / detail maps — light base + label overlay. */
  tileUrl:
    envTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  labelTileUrl:
    envLabelTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  /**
   * Mobile explore — colorful street base + English reference label overlay.
   * Override with VITE_MAP_TILE_URL / VITE_MAP_LABEL_TILE_URL (e.g. MapTiler language=en).
   */
  exploreTileUrl:
    envTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  exploreLabelTileUrl:
    envLabelTileUrl ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  exploreTileAttribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, TomTom, Garmin, FAO, NOAA, USGS',
  tileAttribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, TomTom, Garmin, FAO, NOAA, USGS',
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

/** Mobile detail pages render their own back header (trip, trail, camp, product). */
export const isMobileDetailRoute = (pathname: string): boolean =>
  /^\/(trip|trail|camp|event|product|activity|event-spot|community-activity)\//.test(pathname);

/**
 * Consumer pages that render their own sticky header (ConsumerShell / MobileScreen / MobileDetailShell).
 * Layout must not also show MobileConsumerNavBar on these routes.
 */
export const CONSUMER_SELF_HEADER_EXACT = [
  '/',
  '/explore',
  '/activities',
  '/community',
  '/shop',
  '/profile',
  '/trail-points',
  '/my-rewards',
  '/groups',
  '/buddies',
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
  '/shop/manage',
  '/agency/manage',
  '/host/security-privacy',
] as const;

export const hasConsumerSelfHeader = (pathname: string): boolean =>
  CONSUMER_SELF_HEADER_EXACT.includes(pathname as (typeof CONSUMER_SELF_HEADER_EXACT)[number]) ||
  CONSUMER_SELF_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  isMobileDetailRoute(pathname);
