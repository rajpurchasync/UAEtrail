import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { mapFilterLabel } from '../../config/exploreMapFilters';
import { sortExploreActivities, sortExploreVenues } from '../../utils/exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import type { ActivityListFilterKey, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import {
  ACTIVITY_LIST_FILTERS,
  type DesktopBrowseTab,
  VENUE_LIST_FILTERS,
} from './exploreBrowsePanelCopy';
import {
  expandMapPins,
  isPhysicalShopItem,
  isOnlineShopItem,
  isShopListItem,
  isShopMapItem,
  matchesActivityFilter,
  matchesMapFilter,
  matchesVenueFilter,
} from './exploreMapPinModel';

type UseExploreBrowseListArgs = {
  items: ExploreMapItemDTO[];
  mapFilter: MapFilterKey;
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  venueRegions: string[];
  query: string;
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
  sidebarPanel,
  isDesktop,
  desktopBrowseTab,
}: UseExploreBrowseListArgs) => {
  const filtered = useMemo(() => {
    let result = items.filter((item) => matchesMapFilter(item, mapFilter));
    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        result = result.filter((item) => item.source === 'activity' || item.source === 'demand');
      } else if (desktopBrowseTab === 'venues') {
        result = result.filter((item) => item.source === 'venue' || isShopMapItem(item));
      }
    }
    return result;
  }, [items, mapFilter, isDesktop, desktopBrowseTab]);

  const mapPins = useMemo(() => expandMapPins(filtered), [filtered]);

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
            .filter((item) => item.source === 'activity' || item.source === 'demand')
            .filter((item) => matchesMapFilter(item, mapFilter))
            .filter(matchesQuery)
        );
      }
      return sortExploreVenues(
        items
          .filter((item) => item.source === 'venue' || isShopMapItem(item))
          .filter((item) => matchesMapFilter(item, mapFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'venues') {
      return sortExploreVenues(
        items
          .filter((item) => item.source === 'venue')
          .filter((item) => matchesVenueFilter(item, venueFilter))
          .filter((item) => venueItemMatchesRegions(item, venueRegions))
          .filter(matchesQuery)
      );
    }

    if (sidebarPanel === 'shops') {
      return sortExploreVenues(items.filter(isShopListItem).filter(matchesQuery));
    }

    return sortExploreActivities(
      items
        .filter((item) => item.source === 'activity' || item.source === 'demand')
        .filter((item) => matchesActivityFilter(item, activityFilter))
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
  ]);

  const shopListSections = useMemo(() => {
    const showShopsPanel =
      sidebarPanel === 'shops' ||
      (isDesktop &&
        (mapFilter === 'shops' ||
          (desktopBrowseTab === 'venues' && listItems.some(isShopListItem))));
    if (!showShopsPanel || !listItems.some(isShopListItem)) return null;
    const physical = sortExploreVenues(listItems.filter(isPhysicalShopItem));
    const online = sortExploreVenues(listItems.filter(isOnlineShopItem));
    return { physical, online };
  }, [listItems, sidebarPanel, isDesktop, desktopBrowseTab, mapFilter]);

  const browseFilterHint = useMemo(() => {
    const parts: string[] = [];
    if (mapFilter !== 'all') {
      parts.push(`Map: ${mapFilterLabel(mapFilter)}`);
    }
    if (sidebarPanel === 'activities' && activityFilter !== 'all') {
      const listLabel =
        ACTIVITY_LIST_FILTERS.find((option) => option.key === activityFilter)?.label ?? 'All';
      parts.push(`List: ${listLabel}`);
    }
    if (sidebarPanel === 'venues' && venueFilter !== 'all') {
      const listLabel =
        VENUE_LIST_FILTERS.find((option) => option.key === venueFilter)?.label ?? 'All';
      parts.push(`List: ${listLabel}`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [mapFilter, sidebarPanel, activityFilter, venueFilter]);

  return { filtered, mapPins, listItems, shopListSections, browseFilterHint };
};
