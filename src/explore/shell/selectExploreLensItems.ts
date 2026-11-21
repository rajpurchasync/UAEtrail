import type { PlaceKind } from '@uaetrail/shared-types';
import { selectActivitiesFromMapItems } from '@/activity-discovery/catalog/activities';
import {
  selectPlacesFromMapItems,
  selectShopsFromMapItems,
} from '@/places-discovery/catalog/places';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import { mapItemMatchesFilterPills } from '../exploreBrowseTaxonomy';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import type { DesktopBrowseTab } from '../ui/exploreBrowsePanelCopy';
import type { DiscoveryMapItems } from '@/discovery/discoveryMapPayload';

export type ExploreLensArgs = {
  /** Unified discovery payload (`GET /explore/map`) — map and list projections share this pool. */
  catalog: DiscoveryMapItems;
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
  sidebarPanel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueFilter: VenueListFilterKey;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  activityModeFilter: ExploreActivityModeFilter;
  priceFilter?: ExplorePriceFilter;
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
  venueRegionOrder?: readonly string[];
};

const activitySliceFilters = (args: ExploreLensArgs) => ({
  mapFilter: args.mapFilter,
  tripMapTopics: args.tripMapTopics,
  buddySubtype: args.buddySubtype,
  outingTopic: args.outingTopic,
  query: '',
  activityDatePreset: args.activityDatePreset,
  activityModeFilter: args.activityModeFilter,
  priceFilter: args.priceFilter ?? 'all',
});

const placeSliceFilters = (args: ExploreLensArgs) => ({
  mapFilter: args.mapFilter,
  venueFilter: args.venueFilter,
  placeMapTopics: args.placeMapTopics,
  venueRegions: args.venueRegions,
  hasTrip: args.hasTrip ?? false,
  facilityKinds: args.facilityKinds ?? [],
  venueRegionOrder: args.venueRegionOrder,
});

/**
 * Explore shell lens → pin pool. Uses the same domain selectors as the aligned list panel.
 * Text search is applied by the caller (`useExploreBrowseList`).
 */
export const selectExploreLensItems = (args: ExploreLensArgs): DiscoveryMapItems => {
  const { catalog, isDesktop, desktopBrowseTab, sidebarPanel } = args;

  if (isDesktop) {
    const pool = catalog.filter((item) => mapItemMatchesFilterPills(item, []));
    if (desktopBrowseTab === 'venues') {
      return selectPlacesFromMapItems(pool, placeSliceFilters(args));
    }
    const activities = selectActivitiesFromMapItems(pool, activitySliceFilters(args));
    if (args.venueRegions.length === 0) return activities;
    return activities.filter((item) => venueItemMatchesRegions(item, args.venueRegions));
  }

  if (sidebarPanel === 'venues') {
    return selectPlacesFromMapItems(catalog, placeSliceFilters(args));
  }

  if (sidebarPanel === 'shops') {
    return selectShopsFromMapItems(catalog, args.venueRegionOrder);
  }

  const activities = selectActivitiesFromMapItems(catalog, activitySliceFilters(args));
  if (args.venueRegions.length === 0) return activities;
  return activities.filter((item) => venueItemMatchesRegions(item, args.venueRegions));
};