/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Mobile bottom navigation: Explore (Home) | Trips | Community | Shop | Profile */
export const MOBILE_NAV = [
  { to: '/', label: 'Explore', match: ['/'] },
  { to: '/trips', label: 'Trips', match: ['/trips', '/trip'] },
  { to: '/community', label: 'Community', match: ['/community'] },
  { to: '/shop', label: 'Shop', match: ['/shop', '/product', '/merchant'] },
  { to: '/profile', label: 'Profile', match: ['/profile', '/my-requests', '/messages', '/notifications'] },
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
  provider: 'openstreetmap' as const,
  defaultCenter: { lat: 24.4539, lng: 54.3773 },
  defaultZoom: 8,
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
  '/onboarding',
  '/forgot-password'
] as const;

export const isConsumerChromeHidden = (pathname: string): boolean =>
  CONSUMER_CHROME_HIDDEN_EXACT.includes(pathname as (typeof CONSUMER_CHROME_HIDDEN_EXACT)[number]) ||
  CONSUMER_CHROME_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
