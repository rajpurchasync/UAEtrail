import type { HostPublishingTier } from './host-publishing-tier.js';

/**
 * Host **storefront** brand type — orthogonal to `EntityKind` (URLs).
 * @see docs/DOMAIN_CANONICALS.md §1.3
 */
export type PublishingProfileKind =
  | 'community'
  | 'pro_guide'
  | 'agency'
  | 'shop'
  | 'ecommerce'
  | 'hospitality'
  | 'partner';

/** Pro membership upgrade path (product). */
export type ProMembershipPath = 'individual' | 'business' | 'partner';

/** Required when `ProMembershipPath` is `business`. */
export type BusinessProSubtype =
  | 'shop'
  | 'tour_agency'
  | 'ecommerce'
  | 'hospitality';

/** Wire `ownedProfiles[].type` + tenant publishing tier → storefront kind. */
export const resolvePublishingProfileKind = (input: {
  ownedType: 'guide' | 'agency' | 'shop';
  publishingTier: HostPublishingTier;
}): PublishingProfileKind => {
  if (input.ownedType === 'shop') return 'shop';
  if (input.ownedType === 'agency') return 'agency';
  if (input.publishingTier === 'professional') return 'pro_guide';
  return 'community';
};

/** Tenants that may host Organize activities (not shop-only storefronts). */
export const isOrganizeActivityHostProfileType = (ownedType: 'guide' | 'agency' | 'shop'): boolean =>
  ownedType === 'guide' || ownedType === 'agency';
