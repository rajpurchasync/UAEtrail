import type { FacilityCatalogQuery, PlaceCatalogQuery } from './catalog-query.js';

/** Canonical catalog filters at HTTP boundary — `destinationId` / `onSiteId` only. */
export const normalizePlaceCatalogQuery = (query: PlaceCatalogQuery): PlaceCatalogQuery => {
  const destinationId = query.destinationId?.trim();
  return destinationId ? { ...query, destinationId } : query;
};

export const normalizeFacilityCatalogQuery = (query: FacilityCatalogQuery): FacilityCatalogQuery => {
  const destinationId = query.destinationId?.trim();
  const onSiteId = query.onSiteId?.trim() ?? query.onSiteId;
  const normalized: FacilityCatalogQuery = { ...query };
  if (destinationId) normalized.destinationId = destinationId;
  if (onSiteId !== undefined) {
    normalized.onSiteId = onSiteId || null;
  }
  return normalized;
};