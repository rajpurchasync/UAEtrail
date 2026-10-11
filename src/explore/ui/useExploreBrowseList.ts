import { useMemo } from 'react';
import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities, sortExploreVenues } from '../exploreListSort';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey } from '../routing';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { DesktopBrowseTab } from './exploreBrowsePanelCopy';
import {
  expandMapPins,
  isBuddyMapItem,
  isOnlineShopItem,
  isPhysicalShopItem,
  isPlacesMapItem,
  isShopListItem,
  layoutColocatedMapPins,
  matchesBuddyMapFilter,
  matchesPlacesMapFilter,
} from './exploreMapPinModel';
import {
  mapItemMatchesFilterPills,
  mapItemMatchesSearchScope,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import type { ExploreBrowseListMode } from './useExploreBrowseUrlState';
import { matchesActivityDateFilter } from '../exploreActivityDateFilter';
import { countExploreSearchScopes, exploreItemMatchesQuery } from '../exploreSearchMatches';
import {
  exploreMapItemMatchesActivityModeFilter,
  type ExploreActivityModeFilter,
} from '../exploreActivityModeFilter';

type UseExploreBrowseListArgs = {
  items: ExploreMapItemDTO[];
  /** Link-only activities — show on map for peek, not in public browse lists. */
  ephemeralMapItems?: ExploreMapItemDTO[];
  mapFilter: MapFilterKey;
  venueRegions: string[];
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  listMode: ExploreBrowseListMode;
  searchScope: ExploreSearchScopeKey | null;
  sidebarPanel: ExplorePanel;
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  activityModeFilter?: ExploreActivityModeFilter;
};

const dedupeExploreListById = (list: ExploreMapItemDTO[]): ExploreMapItemDTO[] => {
  const seen = new Set<string>();
  const unique: ExploreMapItemDTO[] = [];
  for (const item of list) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
};

const listFromPool = (pool: ExploreMapItemDTO[], matchesQuery: (item: ExploreMapItemDTO) => boolean) => {
  const matching = dedupeExploreListById(pool.filter(matchesQuery));
  const plans = matching.filter((item) => isTimeBoundExploreMapItem(item));
  const spots = matching.filter((item) => mapItemMatchesSearchScope(item, 'places'));
  const shops = matching.filter((item) => mapItemMatchesSearchScope(item, 'shops'));
  return dedupeExploreListById([
    ...sortExploreActivities(plans),
    ...sortExploreVenues([...spots, ...shops]),
  ]);
};

export const useExploreBrowseList = ({
  items,
  ephemeralMapItems = [],
  mapFilter,
  venueRegions,
  query,
  activityDatePreset,
  listMode,
  searchScope,
  sidebarPanel,
  isDesktop,
  desktopBrowseTab,
  buddySubtype,
  outingTopic,
  activityModeFilter = 'all',
}: UseExploreBrowseListArgs) => {
  const mapItems = useMemo(() => {
    const itemIds = new Set(items.map((entry) => entry.id));
    const merged = [
      ...items,
      ...ephemeralMapItems.filter((entry) => !itemIds.has(entry.id)),
    ];
    let pool = merged;
    if (isDesktop) {
      pool = pool.filter((item) => mapItemMatchesFilterPills(item, []));
      if (desktopBrowseTab === 'venues') {
        pool = pool.filter(isPlacesMapItem);
      } else {
        pool = pool
          .filter(isBuddyMapItem)
          .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter));
      }
    } else if (sidebarPanel === 'venues') {
      pool = pool
        .filter(isPlacesMapItem)
        .filter((item) => matchesPlacesMapFilter(item, mapFilter))
        .filter((item) => venueItemMatchesRegions(item, venueRegions));
    } else if (sidebarPanel === 'shops') {
      pool = pool.filter(isShopListItem);
    } else {
      pool = pool
        .filter(isBuddyMapItem)
        .filter((item) => matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic))
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
        .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter));
    }
    if (query.trim()) {
      pool = pool.filter((item) => exploreItemMatchesQuery(item, query));
    }
    return pool;
  }, [
    items,
    ephemeralMapItems,
    query,
    isDesktop,
    desktopBrowseTab,
    sidebarPanel,
    mapFilter,
    activityDatePreset,
    venueRegions,
    buddySubtype,
    outingTopic,
    activityModeFilter,
  ]);

  const browseListMode: ExploreBrowseListMode = isDesktop ? 'default' : listMode;

  const mapPins = useMemo(() => layoutColocatedMapPins(expandMapPins(mapItems)), [mapItems]);

  const browseListBase = useMemo(() => {
    const matchesBuddy = (item: ExploreMapItemDTO) =>
      matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic);

    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        return dedupeExploreListById(
          sortExploreActivities(
            items
              .filter(isBuddyMapItem)
              .filter(matchesBuddy)
              .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
              .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter))
          )
        );
      }
      return dedupeExploreListById(
        sortExploreVenues(
          items
            .filter(isPlacesMapItem)
            .filter((item) => matchesPlacesMapFilter(item, mapFilter))
            .filter((item) => venueItemMatchesRegions(item, venueRegions))
        )
      );
    }

    if (sidebarPanel === 'venues') {
      return dedupeExploreListById(
        sortExploreVenues(
          items
            .filter(isPlacesMapItem)
            .filter((item) => matchesPlacesMapFilter(item, mapFilter))
            .filter((item) => venueItemMatchesRegions(item, venueRegions))
        )
      );
    }

    if (sidebarPanel === 'shops') {
      return dedupeExploreListById(sortExploreVenues(items.filter(isShopListItem)));
    }

    return dedupeExploreListById(
      sortExploreActivities(
        items
          .filter(isBuddyMapItem)
          .filter(matchesBuddy)
          .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
          .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter))
      )
    );
  }, [
    items,
    mapFilter,
    activityDatePreset,
    venueRegions,
    isDesktop,
    desktopBrowseTab,
    sidebarPanel,
    buddySubtype,
    outingTopic,
    activityModeFilter,
  ]);

  const listItems = useMemo(() => {
    if (browseListMode === 'people') return [];

    const hasQuery = query.trim().length > 0;
    const matchesQuery = (item: ExploreMapItemDTO) => exploreItemMatchesQuery(item, query);

    /** Panel search — filter the active tab list; ignore stale mobile `searchScope` on desktop. */
    if (hasQuery && isDesktop) {
      return dedupeExploreListById(browseListBase.filter(matchesQuery));
    }

    const buddyListPool = () =>
      items
        .filter(isBuddyMapItem)
        .filter((item) => matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic))
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
        .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter));

    const hostedTripsPool = () =>
      items
        .filter((item) => mapItemMatchesSearchScope(item, 'activities'))
        .filter((item) => matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic))
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
        .filter((item) => exploreMapItemMatchesActivityModeFilter(item, activityModeFilter));

    const peopleListPool = () =>
      items
        .filter((item) => mapItemMatchesSearchScope(item, 'people'))
        .filter((item) => matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic));

    const placesListPool = () =>
      items
        .filter(isPlacesMapItem)
        .filter((item) => matchesPlacesMapFilter(item, mapFilter))
        .filter((item) => venueItemMatchesRegions(item, venueRegions));

    if (hasQuery && searchScope === 'activities') {
      return sortExploreActivities(hostedTripsPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'people') {
      return sortExploreActivities(peopleListPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'places') {
      return sortExploreVenues(placesListPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'shops') {
      return sortExploreVenues(items.filter(isShopListItem).filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'agencies') {
      return sortExploreVenues(items.filter((item) => item.source === 'agency').filter(matchesQuery));
    }

    if (hasQuery && searchScope === null) {
      const pool = dedupeExploreListById([...buddyListPool(), ...placesListPool()]);
      return listFromPool(pool, matchesQuery);
    }

    return dedupeExploreListById(browseListBase.filter(matchesQuery));
  }, [
    browseListBase,
    query,
    browseListMode,
    searchScope,
    items,
    mapFilter,
    activityDatePreset,
    venueRegions,
    buddySubtype,
    outingTopic,
    isDesktop,
  ]);

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(items, query, activityDatePreset, venueRegions),
    [items, query, activityDatePreset, venueRegions]
  );

  const shopListSections = useMemo(() => {
    const inPlacesContext = isDesktop ? desktopBrowseTab === 'venues' : sidebarPanel === 'venues' || sidebarPanel === 'shops';
    if (!inPlacesContext || !listItems.some(isShopListItem)) return null;
    /** Physical vs online split is for shops-only browse — not the mixed "All places" list. */
    const shopsOnlyView = mapFilter === 'shops' || sidebarPanel === 'shops';
    if (!shopsOnlyView) return null;
    const physical = sortExploreVenues(listItems.filter(isPhysicalShopItem));
    const online = sortExploreVenues(listItems.filter(isOnlineShopItem));
    return { physical, online };
  }, [listItems, isDesktop, desktopBrowseTab, sidebarPanel, mapFilter]);

  return {
    mapPins,
    listItems,
    shopListSections,
    searchScopeCounts,
  };
};
