/**
 * Catalog row lifecycle (places + facilities) — Program CPC.
 * @see docs/SYSTEM_COHERENCE.md §8.4
 */

export const CATALOG_MODERATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'suspended',
] as const;

export type CatalogModerationStatus = (typeof CATALOG_MODERATION_STATUSES)[number];

export const CATALOG_PUBLICATION_STATUSES = [
  'listed',
  'unlisted',
  'anchor_only',
] as const;

export type CatalogPublicationStatus = (typeof CATALOG_PUBLICATION_STATUSES)[number];
