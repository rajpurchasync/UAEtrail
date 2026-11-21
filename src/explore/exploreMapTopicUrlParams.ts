/**
 * Trip/place map topic URL params — parse/serialize only (no pin-model imports).
 */

/** Mobile map trip quick-filter topics (`tripTypes=` URL). */
export type TripMapTopicKey = 'hiking' | 'camping' | 'rideshare' | 'others';

/** Mobile map venue quick-filter topics (`placeTypes=` URL). */
export type PlaceMapTopicKey = 'hiking' | 'camping' | 'facilities' | 'shops' | 'others';

export const EXPLORE_TRIP_TYPES_PARAM = 'tripTypes';
export const EXPLORE_PLACE_TYPES_PARAM = 'placeTypes';

export const EXPLORE_PLACE_TOPIC_OPTIONS: ReadonlyArray<{ key: PlaceMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking trail' },
  { key: 'camping', label: 'Camping spots' },
  { key: 'others', label: 'Hubs' },
];

/** List `filter=shop` / map `placeTypes=shops` — list uses `shop`, map wire uses `shops`. */
export const aliasListPlaceTopicToMap = (key: string): PlaceMapTopicKey | null => {
  if (key === 'shop' || key === 'shops') return 'shops';
  if (key === 'hubs' || key === 'others') return 'others';
  if (key === 'hiking' || key === 'camping' || key === 'facilities') return key;
  return null;
};

export const aliasPlaceMapTopicToList = (
  key: PlaceMapTopicKey
): 'hiking' | 'camping' | 'facilities' | 'shop' | 'others' => (key === 'shops' ? 'shop' : key);

const TRIP_TOPIC_SET = new Set<TripMapTopicKey>(['hiking', 'camping', 'rideshare', 'others']);
const PLACE_TOPIC_SET = new Set<PlaceMapTopicKey>([
  'hiking',
  'camping',
  'facilities',
  'shops',
  'others',
]);

const parseCsvTopics = <T extends string>(raw: string | null, allowed: Set<T>): T[] => {
  if (!raw?.trim()) return [];
  const out: T[] = [];
  for (const part of raw.split(',')) {
    const key = part.trim() as T;
    if (allowed.has(key) && !out.includes(key)) out.push(key);
  }
  return out;
};

export const parseTripMapTopicsParam = (raw: string | null): TripMapTopicKey[] =>
  parseCsvTopics(raw, TRIP_TOPIC_SET);

export const parsePlaceMapTopicsParam = (raw: string | null): PlaceMapTopicKey[] =>
  parseCsvTopics(raw?.replace(/\bhubs\b/g, 'others') ?? null, PLACE_TOPIC_SET);

export const serializeTripMapTopicsParam = (topics: TripMapTopicKey[]): string | null =>
  topics.length > 0 ? topics.join(',') : null;

export const serializePlaceMapTopicsParam = (topics: PlaceMapTopicKey[]): string | null =>
  topics.length > 0 ? topics.join(',') : null;

export const toggleTripMapTopic = (
  current: TripMapTopicKey[],
  key: TripMapTopicKey
): TripMapTopicKey[] =>
  current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key];

export const togglePlaceMapTopic = (
  current: PlaceMapTopicKey[],
  key: PlaceMapTopicKey
): PlaceMapTopicKey[] =>
  current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key];