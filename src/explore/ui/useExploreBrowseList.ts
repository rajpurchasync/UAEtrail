import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities, sortExploreVenues } from '../../utils/exploreListSort';
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
import type { ExploreBrowseListMode, WhosGoingSegment } from './useExploreBrowseUrlState';
import { matchesActivityDateFilter } from '../exploreActivityDateFilter';
import { countExploreSearchScopes, exploreItemMatchesQuery } from '../exploreSearchMatches';

type UseExploreBrowseListArgs = {
  items: ExploreMapItemDTO[];
  /** Link-only activities — show on map for peek, not in public browse lists. */
  ephemeralMapItems?: ExploreMapItemDTO[];
  mapFilter: MapFilterKey;
  venueRegions: string[];
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  listMode: ExploreBrowseListMode;
  whosGoingSegment: WhosGoingSegment;
  searchScope: ExploreSearchScopeKey | null;
  friendIds?: Set<string>;
  sidebarPanel: ExplorePanel;
  isDesktop: boolean;
  desktopBrowseTab: DesktopBrowseTab;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
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
  const plans = matching.filter((item) => item.source === 'activity' || item.source === 'demand');
  const spots = matching.filter((item) => mapItemMatchesSearchScope(item, 'spots'));
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
  whosGoingSegment,
  searchScope,
  friendIds,
  sidebarPanel,
  isDesktop,
  desktopBrowseTab,
  buddySubtype,
  outingTopic,
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
        pool = pool.filter(isBuddyMapItem);
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
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset));
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
  ]);

  const whosGoingPreview = useMemo(() => {
    const activityJoinCount = (item: ExploreMapItemDTO) => {
      if (item.slotsTotal != null && item.slotsAvailable != null) {
        return Math.max(0, item.slotsTotal - item.slotsAvailable);
      }
      return item.participantPreviews?.length ?? 0;
    };

    const activities = items
      .filter((item) => item.source === 'activity')
      .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
      .filter((item) => activityJoinCount(item) > 0 || (item.participantPreviews?.length ?? 0) > 0);

    const sorted = [...activities].sort((a, b) => activityJoinCount(b) - activityJoinCount(a));
    const seen = new Set<string>();
    const avatars: Array<{ id: string; name: string; avatar?: string | null }> = [];
    let totalJoining = 0;

    const friendFirst: Array<{ id: string; name: string; avatar?: string | null }> = [];
    const other: Array<{ id: string; name: string; avatar?: string | null }> = [];

    for (const item of sorted) {
      totalJoining += activityJoinCount(item);
      for (const preview of item.participantPreviews ?? []) {
        if (seen.has(preview.id)) continue;
        seen.add(preview.id);
        if (friendIds?.has(preview.id)) friendFirst.push(preview);
        else other.push(preview);
      }
    }

    for (const preview of [...friendFirst, ...other]) {
      if (avatars.length < 3) avatars.push(preview);
    }

    const extraCount = Math.max(0, seen.size - avatars.length);
    return { avatars, totalJoining, extraCount, peopleShown: seen.size };
  }, [items, activityDatePreset, friendIds]);

  const whosGoingListItems = useMemo(() => {
    const matchesQuery = (item: ExploreMapItemDTO) => exploreItemMatchesQuery(item, query);
    const sorted = sortExploreActivities(
      items
        .filter((item) => item.source === 'activity')
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset))
        .filter(matchesQuery)
    );
    return [...sorted].sort((a, b) => {
      const aGoing = (a.slotsTotal ?? 0) - (a.slotsAvailable ?? 0);
      const bGoing = (b.slotsTotal ?? 0) - (b.slotsAvailable ?? 0);
      return bGoing - aGoing;
    });
  }, [items, query, activityDatePreset]);

  const listItems = useMemo(() => {
    if (browseListMode === 'whosGoing' && whosGoingSegment === 'trips') return whosGoingListItems;
    if (browseListMode === 'whosGoing') return [];

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
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset));

    const hostedTripsPool = () =>
      items
        .filter((item) => mapItemMatchesSearchScope(item, 'trips'))
        .filter((item) => matchesBuddyMapFilter(item, mapFilter, buddySubtype, outingTopic))
        .filter((item) => matchesActivityDateFilter(item, activityDatePreset));

    const placesListPool = () =>
      items
        .filter(isPlacesMapItem)
        .filter((item) => matchesPlacesMapFilter(item, mapFilter))
        .filter((item) => venueItemMatchesRegions(item, venueRegions));

    if (hasQuery && searchScope === 'trips') {
      return sortExploreActivities(hostedTripsPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'spots') {
      return sortExploreVenues(placesListPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'shops') {
      return sortExploreVenues(items.filter(isShopListItem).filter(matchesQuery));
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
    whosGoingSegment,
    whosGoingListItems,
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
    whosGoingPreview,
    searchScopeCounts,
    whosGoingTripsCount: whosGoingListItems.length,
    whosGoingListItems,
  };
};
