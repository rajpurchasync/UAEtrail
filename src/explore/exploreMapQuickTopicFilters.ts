import type { MapFilterKey, VenueListFilterKey } from './routing';
import { matchesBuddyMapFilter, matchesPlacesMapFilter } from './ui/exploreMapPinModel';
import type { ExploreBuddySubtypeKey } from './exploreBuddySubtype';
import type { ExploreOutingTopicKey } from './exploreOutingTopic';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

/** Mobile map trip quick-filter topics (`tripTypes=` URL). */
export type TripMapTopicKey = 'hiking' | 'camping' | 'rideshare' | 'others';

/** Mobile map venue quick-filter topics (`placeTypes=` URL). */
export type PlaceMapTopicKey = 'hiking' | 'camping' | 'facilities' | 'shops' | 'others';

export const EXPLORE_TRIP_TYPES_PARAM = 'tripTypes';
export const EXPLORE_PLACE_TYPES_PARAM = 'placeTypes';

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

export const isTripMapTopicKey = (filter: MapFilterKey): filter is TripMapTopicKey =>
  filter === 'hiking' || filter === 'camping' || filter === 'rideshare' || filter === 'others';

export const effectiveTripMapTopics = (
  mapFilter: MapFilterKey,
  tripMapTopics: TripMapTopicKey[]
): TripMapTopicKey[] => {
  if (tripMapTopics.length > 0) return tripMapTopics;
  if (isTripMapTopicKey(mapFilter)) return [mapFilter];
  return [];
};

const placeTopicFromMapFilter = (mapFilter: MapFilterKey): PlaceMapTopicKey | null => {
  if (
    mapFilter === 'hiking' ||
    mapFilter === 'camping' ||
    mapFilter === 'facilities' ||
    mapFilter === 'others'
  ) {
    return mapFilter;
  }
  if (mapFilter === 'shops') return 'shops';
  return null;
};

const placeTopicFromVenueFilter = (venueFilter: VenueListFilterKey): PlaceMapTopicKey | null => {
  if (venueFilter === 'hiking' || venueFilter === 'camping' || venueFilter === 'facilities') return venueFilter;
  if (venueFilter === 'shop') return 'shops';
  if (venueFilter === 'event') return 'others';
  return null;
};

export const effectivePlaceMapTopics = (
  mapFilter: MapFilterKey,
  venueFilter: VenueListFilterKey,
  placeMapTopics: PlaceMapTopicKey[]
): PlaceMapTopicKey[] => {
  if (placeMapTopics.length > 0) return placeMapTopics;
  const fromVenue = placeTopicFromVenueFilter(venueFilter);
  if (fromVenue) return [fromVenue];
  const fromMap = placeTopicFromMapFilter(mapFilter);
  if (fromMap) return [fromMap];
  return [];
};

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

export const matchesTripMapTopicFilter = (
  item: ExploreMapItemDTO,
  tripMapTopics: TripMapTopicKey[],
  mapFilter: MapFilterKey,
  buddySubtype: ExploreBuddySubtypeKey = 'all',
  outingTopic: ExploreOutingTopicKey = 'all'
): boolean => {
  const effective = effectiveTripMapTopics(mapFilter, tripMapTopics);
  if (effective.length === 0) {
    return matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic);
  }
  return effective.some((topic) => matchesBuddyMapFilter(item, topic, buddySubtype, outingTopic));
};

const placeTopicToMapFilter = (topic: PlaceMapTopicKey): MapFilterKey => topic;

export const matchesPlaceMapTopicFilter = (
  item: ExploreMapItemDTO,
  placeMapTopics: PlaceMapTopicKey[],
  mapFilter: MapFilterKey,
  venueFilter: VenueListFilterKey
): boolean => {
  const effective = effectivePlaceMapTopics(mapFilter, venueFilter, placeMapTopics);
  if (effective.length === 0) {
    return matchesPlacesMapFilter(item, mapFilter);
  }
  return effective.some((topic) => matchesPlacesMapFilter(item, placeTopicToMapFilter(topic)));
};
