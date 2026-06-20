/**
 * Locked platform decisions — do not change without product review.
 * Reference: UAE Trail Platform Audit & Strategy plan.
 */

/** Mobile bottom navigation: Explore | Trips | Community | Shop | Profile */
export const MOBILE_NAV = [
  { to: '/discovery', label: 'Explore', match: ['/discovery', '/trail', '/camp'] },
  { to: '/trips', label: 'Trips', match: ['/trips', '/trip'] },
  { to: '/community', label: 'Community', match: ['/community'] },
  { to: '/shop', label: 'Shop', match: ['/shop', '/product', '/merchant'] },
  { to: '/profile', label: 'Profile', match: ['/profile', '/dashboard'] },
] as const;

/** Community MVP: location-anchored Q&A, trip reports, and photo posts — not a generic forum. */
export const COMMUNITY_CATEGORIES = [
  { id: 'questions', label: 'Questions' },
  { id: 'trip-reports', label: 'Trip Reports' },
  { id: 'photos', label: 'Photos' },
  { id: 'tips', label: 'Tips & Gear' },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]['id'];

/** Shop v1: catalog + external buy link + member discount badge — no native checkout. */
export const SHOP_V1 = {
  checkoutMode: 'external' as const,
  memberDiscountPercent: 10,
  showMemberBadge: true,
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
