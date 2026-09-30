/** Second-row browse filter — what kind of pin (within topic). See `explore-browse-ia.md`. */
export type ExplorePinKindFilter = 'all' | 'trips' | 'looking' | 'places' | 'shops';

export const EXPLORE_PIN_KIND_PILLS: ReadonlyArray<{ key: ExplorePinKindFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'trips', label: 'Trips' },
  { key: 'looking', label: 'Looking for' },
  { key: 'places', label: 'Places' },
  { key: 'shops', label: 'Shops' },
];

const PIN_KIND_QUERY = new Set<ExplorePinKindFilter>(['all', 'trips', 'looking', 'places', 'shops']);

export const parseExplorePinKindFilter = (value: string | null): ExplorePinKindFilter => {
  const key = value?.trim().toLowerCase();
  if (key && PIN_KIND_QUERY.has(key as ExplorePinKindFilter)) {
    return key as ExplorePinKindFilter;
  }
  return 'all';
};

export const serializeExplorePinKindFilter = (value: ExplorePinKindFilter): string | null =>
  value === 'all' ? null : value;

