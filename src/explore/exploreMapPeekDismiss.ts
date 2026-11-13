/** Query keys that only move pin focus — do not dismiss the map peek when these alone change. */
const PEEK_ONLY_PARAMS = new Set([
  'pin',
  'compose',
  'hostFrom',
  'myPlan',
  'joinInvite',
  'planWith',
  'area',
  'searchFocus',
]);

/** Fingerprint of browse/list filters — used to close pin peeks when the catalog lens changes. */
export const exploreBrowseDismissPeekFingerprint = (params: URLSearchParams): string =>
  [...params.keys()]
    .filter((key) => !PEEK_ONLY_PARAMS.has(key))
    .sort()
    .map((key) => `${key}=${params.get(key) ?? ''}`)
    .join('&');
