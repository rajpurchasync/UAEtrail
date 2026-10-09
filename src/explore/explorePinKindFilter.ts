/** Second-row browse filter — what kind of pin (within topic). See `explore-browse-ia.md`. */
export type ExplorePinKindFilter = 'all' | 'activities' | 'looking' | 'places' | 'shops';

/** @deprecated Legacy URL value — parsed to {@link ExplorePinKindFilter}. */
export type ExplorePinKindFilterLegacyWire = 'trips';

/** Visible map pills — seeking pins roll into **Activities** (M0); `looking` stays in the type for deep links / list handoff. */
export const EXPLORE_PIN_KIND_PILLS: ReadonlyArray<{ key: ExplorePinKindFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'activities', label: 'Activities' },
  { key: 'places', label: 'Places' },
  { key: 'shops', label: 'Shops' },
];

const PIN_KIND_QUERY = new Set<string>(['all', 'activities', 'trips', 'looking', 'places', 'shops']);

export const parseExplorePinKindFilter = (value: string | null): ExplorePinKindFilter => {
  const key = value?.trim().toLowerCase();
  if (!key || !PIN_KIND_QUERY.has(key)) return 'all';
  if (key === 'trips') return 'activities';
  return key as ExplorePinKindFilter;
};

export const serializeExplorePinKindFilter = (value: ExplorePinKindFilter): string | null =>
  value === 'all' ? null : value;
