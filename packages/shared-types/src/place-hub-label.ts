/**
 * Place-hub bucket label — named grouping under a curated destination (e.g. Wadi Shawka).
 */

export type PlaceHubLabelDoc = {
  placeHubLabel?: string | null;
};

export const readPlaceHubLabel = (row: PlaceHubLabelDoc | null | undefined): string | null => {
  const canonical = row?.placeHubLabel?.trim();
  return canonical || null;
};

export const placeHubLabelMongoPatch = (
  placeHubLabel: string | null | undefined
): { placeHubLabel: string | null } => {
  const trimmed = placeHubLabel?.trim() ?? '';
  return trimmed ? { placeHubLabel: trimmed } : { placeHubLabel: null };
};