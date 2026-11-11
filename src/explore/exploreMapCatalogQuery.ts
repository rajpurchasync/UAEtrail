import type { ExplorePinKindFilter } from './explorePinKindFilter';
import type { MapFilterKey, VenueListFilterKey } from './routing';
import {
  effectivePlaceMapTopics,
  effectiveTripMapTopics,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from './exploreMapQuickTopicFilters';

export type ExploreMapCatalogQuery = {
  sources: string;
  includeRideshare: boolean;
};

/**
 * What the home map draws. `/list` does not use this — it keeps the full catalog.
 * Rideshare activities load only when that topic is selected.
 */
export const exploreMapCatalogQuery = (input: {
  pinKind: ExplorePinKindFilter;
  mapFilter: MapFilterKey;
  tripTopics?: TripMapTopicKey[];
  placeTopics?: PlaceMapTopicKey[];
  venueFilter?: VenueListFilterKey;
}): ExploreMapCatalogQuery => {
  const trips = effectiveTripMapTopics(input.mapFilter, input.tripTopics ?? []);
  const places = effectivePlaceMapTopics(
    input.mapFilter,
    input.venueFilter ?? 'all',
    input.placeTopics ?? []
  );
  const pin = input.pinKind;
  const onlyFacilities =
    places.length === 1 && places[0] === 'facilities' && trips.length === 0 && pin !== 'activities' && pin !== 'looking';
  const onlyShops =
    pin === 'shops' ||
    (places.length === 1 && places[0] === 'shops' && trips.length === 0 && pin !== 'activities' && pin !== 'looking');
  const onlyRides =
    trips.length === 1 && trips[0] === 'rideshare' && places.length === 0 && pin !== 'places' && pin !== 'locations';

  if (onlyFacilities) return { sources: 'facility', includeRideshare: false };
  if (onlyShops) return { sources: 'shop,agency', includeRideshare: false };
  if (onlyRides) return { sources: 'activity', includeRideshare: true };

  const sources = new Set<string>();
  if (pin === 'activities' || pin === 'looking') sources.add('activity');
  else if (pin === 'places' || pin === 'locations') sources.add('place');
  else {
    sources.add('place');
    sources.add('activity');
  }
  if (places.includes('facilities')) sources.add('facility');
  if (places.includes('shops')) {
    sources.add('shop');
    sources.add('agency');
  }
  if (trips.includes('rideshare')) sources.add('activity');

  return {
    sources: [...sources].join(','),
    includeRideshare: trips.includes('rideshare'),
  };
};
