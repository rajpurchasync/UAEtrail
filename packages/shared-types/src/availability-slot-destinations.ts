/** Emirate / region names a member is willing to go (slot-scoped; OR semantics in browse). */
export const MAX_AVAILABILITY_DESTINATION_REGIONS = 7;

export const sanitizeDestinationRegions = (
  values: readonly string[] | null | undefined
): string[] | null => {
  if (!values?.length) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= MAX_AVAILABILITY_DESTINATION_REGIONS) break;
  }
  return out.length > 0 ? out : null;
};

export const destinationRegionsOverlap = (
  slotRegions: readonly string[] | null | undefined,
  filterRegion: string | null | undefined
): boolean => {
  const needle = filterRegion?.trim();
  if (!needle) return true;
  const regions = sanitizeDestinationRegions(slotRegions);
  if (!regions?.length) return true;
  const lower = needle.toLowerCase();
  return regions.some((r) => r.toLowerCase() === lower);
};