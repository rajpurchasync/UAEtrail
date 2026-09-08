/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Right-side hamburger drawer order (mobile/PWA only). */
export const MOBILE_DRAWER_MENU = [
  {
    label: 'My Profile',
    to: '/profile',
    match: ['/profile', '/favorites', '/my-requests', '/messages'],
    profileLink: true,
  },
  { label: 'Notifications', to: '/notifications', match: ['/notifications'] },
  { label: 'Trails & Spots', to: '/discovery', match: ['/discovery', '/trail', '/camp'] },
  { label: 'Upcoming Activities', to: '/activities', match: ['/activities', '/trips', '/trip', '/activity'] },
  { label: 'Gears Shop', to: '/shop', match: ['/shop', '/product', '/merchant'] },
  { label: 'Community', to: '/community', match: ['/community'] },
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
 * Map provider for Discovery (Phase 2).
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
  /** Discovery / detail maps — light base + label overlay. */
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
  '/merchant'
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
  /^\/(trip|trail|camp|product|activity|event-spot|community-activity)\//.test(pathname);
