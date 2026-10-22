import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { selectActivitiesFromExploreCatalog } from '@/activity-discovery/catalog/activities';
import {
  selectPlacesFromExploreCatalog,
  selectShopsFromExploreCatalog,
} from '@/places-discovery/catalog/places';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey } from '../routing';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import { mapItemMatchesFilterPills } from '../exploreBrowseTaxonomy';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import type { DesktopBrowseTab } from '../ui/exploreBrowsePanelCopy';

export type ExploreMapPinCatalogArgs = {
  catalog: ExploreMapItemDTO[];
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
  sidebarPanel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  activityModeFilter: ExploreActivityModeFilter;
};

const activityCatalogFilters = (args: ExploreMapPinCatalogArgs) => ({
  mapFilter: args.mapFilter,
  buddySubtype: args.buddySubtype,
  outingTopic: args.outingTopic,
  query: '',
  activityDatePreset: args.activityDatePreset,
  activityModeFilter: args.activityModeFilter,
});

/**
 * Map pin pool for the active explore lens — same discovery selectors as the aligned list panel.
 * Query filtering is applied by the caller (`useExploreBrowseList`).
 */
export const selectExploreMapPinCatalog = (args: ExploreMapPinCatalogArgs): ExploreMapItemDTO[] => {
  const { catalog, isDesktop, desktopBrowseTab, sidebarPanel } = args;

  if (isDesktop) {
    const pool = catalog.filter((item) => mapItemMatchesFilterPills(item, []));
    if (desktopBrowseTab === 'venues') {
      return selectPlacesFromExploreCatalog(pool, {
        mapFilter: args.mapFilter,
        venueRegions: args.venueRegions,
      });
    }
    const activities = selectActivitiesFromExploreCatalog(pool, activityCatalogFilters(args));
    if (args.venueRegions.length === 0) return activities;
    return activities.filter((item) => venueItemMatchesRegions(item, args.venueRegions));
  }

  if (sidebarPanel === 'venues') {
    return selectPlacesFromExploreCatalog(catalog, {
      mapFilter: args.mapFilter,
      venueRegions: args.venueRegions,
    });
  }

  if (sidebarPanel === 'shops') {
    return selectShopsFromExploreCatalog(catalog);
  }

  const activities = selectActivitiesFromExploreCatalog(catalog, activityCatalogFilters(args));
  if (args.venueRegions.length === 0) return activities;
  return activities.filter((item) => venueItemMatchesRegions(item, args.venueRegions));
};
