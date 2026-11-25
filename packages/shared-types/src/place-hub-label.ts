/**
 * Place-hub bucket label — named grouping under a curated destination (e.g. Wadi Shawka).
 * Mongo legacy key `areaLabel`; canonical wire + new writes use `placeHubLabel`.
 */

export type PlaceHubLabelDoc = {
  placeHubLabel?: string | null;
  /** @deprecated Mongo legacy — read only until backfill. */
  areaLabel?: string | null;
};

export const readPlaceHubLabel = (row: PlaceHubLabelDoc | null | undefined): string | null => {
  const canonical = row?.placeHubLabel?.trim();
  if (canonical) return canonical;
  const legacy = row?.areaLabel?.trim();
  return legacy || null;
};

export const placeHubLabelMongoPatch = (
  placeHubLabel: string | null | undefined
): { placeHubLabel: string | null; areaLabel?: null } => {
  const trimmed = placeHubLabel?.trim() ?? '';
  return trimmed
    ? { placeHubLabel: trimmed, areaLabel: null }
    : { placeHubLabel: null, areaLabel: null };
};