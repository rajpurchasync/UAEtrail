import type { MapFilterKey } from './discoveryUrlParams';
import type { VenueListFilterKey } from './routing';
import { matchesOthersMapFilter, matchesPlacesMapFilter } from './ui/exploreMapPinModel';
import type { ExploreOthersSubtypeKey } from './exploreOthersSubtype';
import type { ExploreOutingTopicKey } from './exploreOutingTopic';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

export type {
  TripMapTopicKey,
  PlaceMapTopicKey,
} from './exploreMapTopicUrlParams';
export {
  EXPLORE_TRIP_TYPES_PARAM,
  EXPLORE_PLACE_TYPES_PARAM,
  parseTripMapTopicsParam,
  parsePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
  serializePlaceMapTopicsParam,
} from './exploreMapTopicUrlParams';
import type { PlaceMapTopicKey, TripMapTopicKey } from './exploreMapTopicUrlParams';

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

export {
  toggleTripMapTopic,
  togglePlaceMapTopic,
} from './exploreMapTopicUrlParams';

export const matchesTripMapTopicFilter = (
  item: ExploreMapItemDTO,
  tripMapTopics: TripMapTopicKey[],
  mapFilter: MapFilterKey,
  othersSubtype: ExploreOthersSubtypeKey = 'all',
  outingTopic: ExploreOutingTopicKey = 'all'
): boolean => {
  const effective = effectiveTripMapTopics(mapFilter, tripMapTopics);
  if (effective.length === 0) {
    return matchesOthersMapFilter(item, mapFilter, othersSubtype, outingTopic);
  }
  return effective.some((topic) => matchesOthersMapFilter(item, topic, othersSubtype, outingTopic));
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
