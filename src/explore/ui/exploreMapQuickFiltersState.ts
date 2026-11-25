import {
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  DEFAULT_CREW_PROFESSIONAL_KIND,
} from '@/crew-discovery/crewBrowseState';
import { DEFAULT_CREW_PEOPLE_SURFACE_WIRE } from '@/crew-discovery/crewPeopleSurface';
import type { PlaceKind } from '@uaetrail/shared-types';
import type {
  BrowseListBucket,
  BrowseListFilterState,
  ListVenuePlaceTopicKey,
} from '../../discovery/discoverySession';
import type { ExploreActivityDatePreset, ExplorePanel } from '../routing';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import { aliasPlaceMapTopicToList, type ExplorePriceFilter } from '../exploreOptionalFilters';

export const explorePanelToBrowseListBucket = (panel: ExplorePanel): BrowseListBucket =>
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
  crewBrowseLane: DEFAULT_CREW_BROWSE_LANE,
  crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
  crewProfessionalKind: DEFAULT_CREW_PROFESSIONAL_KIND,
  crewPeopleSurface: DEFAULT_CREW_PEOPLE_SURFACE_WIRE,
  hasTrip: input.hasTrip,
  facilityKinds: [...input.facilityKinds],
  audience: 'anyone',
});
