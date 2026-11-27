import type { ActivityListFilterKey, VenueListFilterKey } from '../../routing';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../../exploreMapQuickTopicFilters';

export const tripTopicToActivityFilter = (topics: TripMapTopicKey[]): ActivityListFilterKey => {
  if (topics.length !== 1) return 'all';
  const only = topics[0];
  if (only === 'others') return 'event';
  return only === 'rideshare' ? 'rideshare' : only;
};

export const placeTopicToVenueFilter = (topics: PlaceMapTopicKey[]): VenueListFilterKey => {
  if (topics.length !== 1) return 'all';
  const only = topics[0];
  if (only === 'shops') return 'shop';
  if (only === 'facilities') return 'facilities';
  if (only === 'others') return 'event';
  return only;
};