import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities, sortExploreVenues } from '../../utils/exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import type { ActivityListFilterKey, ExploreActivityDatePreset, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import {
  type DesktopBrowseTab,
} from './exploreBrowsePanelCopy';
import {
  expandMapPins,
  layoutColocatedMapPins,
  isPhysicalShopItem,
  isOnlineShopItem,
  isShopListItem,
  isPlacesMapItem,
  isBuddyMapItem,
  matchesBuddyMapFilter,
  matchesPlacesMapFilter,
} from './exploreMapPinModel';
import { matchesActivityDateFilter } from '../exploreActivityDateFilter';

type UseExploreBrowseListArgs = {
  items: ExploreMapItemDTO[];
  mapFilter: MapFilterKey;
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  venueRegions: string[];
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  sidebarPanel: ExplorePanel;
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
};

export const useExploreBrowseList = ({
  items,
  mapFilter,
  activityFilter,
  venueFilter,
  venueRegions,
  query,
  activityDatePreset,
  sidebarPanel,
  isDesktop,
  desktopBrowseTab,
}: UseExploreBrowseListArgs) => {
  const placesMode = isDesktop ? desktopBrowseTab === 'venues' : sidebarPanel === 'venues';
  const buddyMode = !placesMode;

  const filtered = useMemo(() => {
    const matchFilter = (item: ExploreMapItemDTO) =>
      placesMode
        ? matchesPlacesMapFilter(item, mapFilter)
        : matchesBuddyMapFilter(item, mapFilter);

    let result = items.filter(matchFilter);
    if (buddyMode) {
      result = result.filter((item) => matchesActivityDateFilter(item, activityDatePreset));
    }
    if (placesMode) {
      result = result.filter(isPlacesMapItem);
      result = result.filter((item) => venueItemMatchesRegions(item, venueRegions));
    } else {
      result = result.filter(isBuddyMapItem);
    }
    return result;
  }, [items, mapFilter, activityDatePreset, placesMode, venueRegions]);

  const mapPins = useMemo(
    () => layoutColocatedMapPins(expandMapPins(filtered)),
    [filtered]
  );

  const listItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (item: ExploreMapItemDTO) => {
      if (!q) return true;
      return `${item.title} ${item.subtitle ?? ''} ${item.featuredPerson?.displayName ?? item.hostName ?? ''}`
        .toLowerCase()
        .includes(q);
    };

    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        return sortExploreActivities(
          items
            .filter(isBuddyMapItem)
            .filter((item) => matchesBuddyMapFilter(item, mapFilter))
            .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
            .filter(matchesQuery)
        );
      }
      return sortExploreVenues(
        items
          .filter(isPlacesMapItem)
          .filter((item) => matchesPlacesMapFilter(item, mapFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'venues') {
      return sortExploreVenues(
        items
          .filter(isPlacesMapItem)
          .filter((item) => matchesPlacesMapFilter(item, mapFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'shops') {
      return sortExploreVenues(items.filter(isShopListItem).filter(matchesQuery));
    }

    return sortExploreActivities(
      items
        .filter(isBuddyMapItem)
        .filter((item) => matchesBuddyMapFilter(item, mapFilter))
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
        .filter(matchesQuery)
    );
  }, [
    items,
    activityFilter,
    venueFilter,
    venueRegions,
    query,
    sidebarPanel,
    isDesktop,
    desktopBrowseTab,
    mapFilter,
    activityDatePreset,
  ]);

  const shopListSections = useMemo(() => {
    const showShopsPanel = sidebarPanel === 'shops' || mapFilter === 'shops';
    if (!showShopsPanel || !listItems.some(isShopListItem)) return null;
    const physical = sortExploreVenues(listItems.filter(isPhysicalShopItem));
    const online = sortExploreVenues(listItems.filter(isOnlineShopItem));
    return { physical, online };
  }, [listItems, sidebarPanel, mapFilter]);

  return { filtered, mapPins, listItems, shopListSections };
};
