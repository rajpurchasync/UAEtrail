import { MAP_LENS_SPOTS_LABEL } from '../place/geographyVocabulary';

/** Second-row browse filter — what kind of pin (within topic). */
export type ExplorePinKindFilter = 'all' | 'activities' | 'places' | 'shops';

/** Visible map pills — fixed availability shares the Activities lens (no separate pill). */
export const EXPLORE_PIN_KIND_PILLS: ReadonlyArray<{ key: ExplorePinKindFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'activities', label: 'Activities' },
  { key: 'places', label: MAP_LENS_SPOTS_LABEL },
  { key: 'shops', label: 'Shops' },
];

export const parseExplorePinKindFilter = (value: string | null): ExplorePinKindFilter => {
  const key = value?.trim().toLowerCase();
  if (key === 'activities' || key === 'places' || key === 'shops') return key;
  return 'all';
};

export const serializeExplorePinKindFilter = (value: ExplorePinKindFilter): string | null =>
  value === 'all' ? null : value;

