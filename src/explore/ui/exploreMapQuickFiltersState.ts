import type { PlaceKind } from '@uaetrail/shared-types';
import type { BrowseListFilterState } from '../../list/browseListFilters';
import type { ListExplorerBucket } from '../../list/explorer/listExplorerBucket';
import type { ListVenuePlaceTopicKey } from '../../list/listVenuePlaceTopics';
import type { ExploreActivityDatePreset, ExplorePanel } from '../routing';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import { aliasPlaceMapTopicToList, type ExplorePriceFilter } from '../exploreOptionalFilters';

export const explorePanelToListExplorerBucket = (panel: ExplorePanel): ListExplorerBucket =>
  panel === 'venues' || panel === 'shops' ? 'places' : 'events';

/** Map chrome quick filters — same `BrowseListFilterState` slice as `/list` (`ListExplorerQuickFilters`). */
export const exploreMapQuickFiltersBrowseState = (input: {
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
  activityDatePreset: ExploreActivityDatePreset;
}): BrowseListFilterState => ({
  query: '',
  categories: [],
  tripTopics: [...input.tripMapTopics],
  tripAvailabilityOnly: false,
  placeTopics: input.placeMapTopics
    .map(aliasPlaceMapTopicToList)
    .filter((key): key is ListVenuePlaceTopicKey => key != null),
  price: input.priceFilter,
  when: 'any',
  activityDatePreset: input.activityDatePreset,
  peopleBrowseTab: 'available',
  hasTrip: input.hasTrip,
  facilityKinds: [...input.facilityKinds],
  audience: 'anyone',
});
