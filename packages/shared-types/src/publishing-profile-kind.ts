import type { HostPublishingTier } from './host-publishing-tier.js';

/**
 * **Publishing profile kind** — flavor of public publishing identity (`publishingProfileKind` on the wire).
 * Chooses public shell (member card vs brand page), desk modules, and map/discovery behavior.
 * Orthogonal to `EntityKind` (URL routes). Business kinds use a **brand storefront** URL; `community` and
 * `pro_guide` use **`/member/:userId`** — not a separate storefront product.
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

/** Wire `ownedProfiles[].type` + tenant publishing tier → publishing profile kind. */
export const resolvePublishingProfileKind = (input: {
  ownedType: 'guide' | 'agency' | 'shop';
  publishingTier: HostPublishingTier;
}): PublishingProfileKind => {
  if (input.ownedType === 'shop') return 'shop';
  if (input.ownedType === 'agency') return 'agency';
  if (input.publishingTier === 'professional') return 'pro_guide';
  return 'community';
};

/** Tenants that may host published outings (verified business shops included). */
export const isActivityPublishingProfileType = (ownedType: 'guide' | 'agency' | 'shop'): boolean =>
  ownedType === 'guide' || ownedType === 'agency' || ownedType === 'shop';

/** Map public tenant wire fields → publishing profile kind (explore links, redirects). */
export const inferPublishingProfileKindFromTenantWire = (tenant: {
  type?: string | null;
  businessMode?: string | null;
  publishingPurpose?: string | null;
}): PublishingProfileKind => {
  const businessMode = tenant.businessMode?.toUpperCase() ?? '';
  const type = tenant.type?.toUpperCase() ?? '';
  if (businessMode === 'SHOP') return 'shop';
  if (businessMode === 'AGENCY' || type === 'COMPANY') return 'agency';
  const purpose = tenant.publishingPurpose?.toLowerCase();
  if (purpose === 'professional') return 'pro_guide';
  if (purpose === 'business') return 'agency';
  if (purpose === 'community') return 'community';
  return 'pro_guide';
};