import type { FacilityCatalogQuery, PlaceCatalogQuery } from './catalog-query.js';

/** Inbound HTTP query keys accepted until catalog alias removal (§8.5 MIG-DESTINATION-GEO). */
export const CATALOG_DESTINATION_QUERY_ALIASES = ['areaId'] as const;
export const CATALOG_ON_SITE_QUERY_ALIASES = ['parentPlaceId'] as const;

export type InboundPlaceCatalogQuery = PlaceCatalogQuery & {
  /** @deprecated Use `destinationId`. Removed from wire 2026-12. */
  areaId?: string;
};

export type InboundFacilityCatalogQuery = FacilityCatalogQuery & {
  /** @deprecated Use `destinationId`. Removed from wire 2026-12. */
  areaId?: string;
  /** @deprecated Use `onSiteId`. Removed from wire 2026-12. */
  parentPlaceId?: string;
};

const trimId = (value: string | null | undefined): string | undefined => {
  const id = value?.trim();
  return id || undefined;
};

/** Canonical catalog filters — merges legacy query aliases into `destinationId`. */
export const normalizePlaceCatalogQuery = (
  query: InboundPlaceCatalogQuery
): PlaceCatalogQuery => {
  const destinationId = trimId(query.destinationId) ?? trimId(query.areaId);
  const { areaId: _areaId, ...rest } = query;
  return destinationId ? { ...rest, destinationId } : rest;
};

/** Canonical facility catalog filters — merges legacy query aliases. */
export const normalizeFacilityCatalogQuery = (
  query: InboundFacilityCatalogQuery
): FacilityCatalogQuery => {
  const destinationId = trimId(query.destinationId) ?? trimId(query.areaId);
  const siteInput = query.onSiteId !== undefined ? query.onSiteId : query.parentPlaceId;
  const { areaId: _areaId, parentPlaceId: _parentPlaceId, ...rest } = query;
  const normalized: FacilityCatalogQuery = { ...rest };
  if (destinationId) normalized.destinationId = destinationId;
  if (siteInput !== undefined) {
    normalized.onSiteId = trimId(siteInput) ?? null;
  }
  return normalized;
};