/** Headcount for capacity — adults + kids (minimum one adult). */
export const resolveActivityPartyHeadcount = (
  adults?: number | null,
  kids?: number | null
): number => {
  const a = typeof adults === 'number' && adults > 0 ? adults : 1;
  const k = typeof kids === 'number' && kids >= 0 ? kids : 0;
  return a + k;
};
