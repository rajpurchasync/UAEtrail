/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Primary mobile navigation tabs: Explore | Activities | Community | Shop | Profile */
export const MOBILE_NAV = [
  { to: '/', label: 'Explore', match: ['/'] },
  { to: '/activities', label: 'Activities', match: ['/activities', '/trips', '/trip'] },
  { to: '/community', label: 'Community', match: ['/community'] },
  { to: '/shop', label: 'Shop', match: ['/shop', '/product', '/merchant'] },
  { to: '/profile', label: 'Profile', match: ['/profile', '/favorites', '/my-requests', '/messages', '/notifications'] },
] as const;

/** Extra links shown in the mobile hamburger menu. */
export const MOBILE_MENU_EXTRAS = [
  { to: '/discovery', label: 'Trails & Spots', match: ['/discovery', '/trail', '/camp'] },
  { to: '/faq', label: 'Help', match: ['/faq'] },
] as const;

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
  { label: 'Upcoming Activities', to: '/activities', match: ['/activities', '/trips', '/trip'] },
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

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]['id'];

/** Feature toggles — flip without redeploying copy in many files. */
export const FEATURE_FLAGS = {
  /** Premium subscription checkout — keep false until launch. */
  membershipEnabled: false,
  /** Gear shop catalog — show Coming Soon until merchants are live. */
  shopComingSoon: true,
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

/** Map provider for Discovery (Phase 2). */
export const MAP_CONFIG = {
  provider: 'carto' as const,
  defaultCenter: { lat: 24.4539, lng: 54.3773 },
  defaultZoom: 8,
  /** English-label raster tiles (OpenStreetMap — no API key). */
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

/** Default platform country — see src/config/regions.ts for GCC catalog. */
export const PLATFORM_DEFAULT_COUNTRY = 'AE';

/** Routes where bottom nav, footer padding, and mobile chrome are hidden. */
export const CONSUMER_CHROME_HIDDEN_PREFIXES = [
  '/admin',
  '/organizer',
  '/dashboard',
  '/merchant'
] as const;

export const CONSUMER_CHROME_HIDDEN_EXACT = [
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
  /^\/(trip|trail|camp|product)\//.test(pathname);
