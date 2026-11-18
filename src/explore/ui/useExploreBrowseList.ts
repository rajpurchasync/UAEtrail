import { useMemo } from 'react';
import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { sortExploreActivities, sortExploreVenues } from '../exploreListSort';
import { selectExploreLensItems } from '../shell/selectExploreLensItems';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { DesktopBrowseTab } from './exploreBrowsePanelCopy';
import {
  expandMapPins,
  isOnlineShopItem,
  isPhysicalShopItem,
  isShopListItem,
  layoutColocatedMapPins,
} from './exploreMapPinModel';
import {
  mapItemIsAgencyHostedActivity,
  mapItemMatchesSearchScope,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import type { ExploreBrowseListMode } from './useExploreBrowseUrlState';
import { selectActivitiesFromMapItems } from '@/activity-discovery/catalog/activities';
import { venueItemMatchesRegions } from '../../utils/venueRegionFilter';
import {
  selectPlacesFromMapItems,
  selectShopsFromMapItems,
} from '@/places-discovery/catalog/places';
import { countExploreSearchScopes, exploreItemMatchesQuery } from '../exploreSearchMatches';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';

type UseExploreBrowseListArgs = {
  items: ExploreMapItemDTO[];
  /** Link-only activities — show on map for peek, not in public browse lists. */
  ephemeralMapItems?: ExploreMapItemDTO[];
  mapFilter: MapFilterKey;
  venueFilter: VenueListFilterKey;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
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
  priceFilter?: ExplorePriceFilter;
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
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
  venueFilter,
  tripMapTopics,
  placeMapTopics,
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
  priceFilter = 'all',
  hasTrip = false,
  facilityKinds = [],
}: UseExploreBrowseListArgs) => {
  const mapItems = useMemo(() => {
    const itemIds = new Set(items.map((entry) => entry.id));
    const merged = [
      ...items,
      ...ephemeralMapItems.filter((entry) => !itemIds.has(entry.id)),
    ];
    let pool = selectExploreLensItems({
      catalog: merged,
      isDesktop,
      desktopBrowseTab,
      sidebarPanel,
      mapFilter,
      venueFilter,
      tripMapTopics,
      placeMapTopics,
      venueRegions,
      activityDatePreset,
      buddySubtype,
      outingTopic,
      activityModeFilter,
      priceFilter,
      hasTrip,
      facilityKinds,
    });
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
    venueFilter,
    tripMapTopics,
    placeMapTopics,
    activityDatePreset,
    venueRegions,
    buddySubtype,
    outingTopic,
    activityModeFilter,
    priceFilter,
    hasTrip,
    facilityKinds,
  ]);

  const browseListMode: ExploreBrowseListMode = isDesktop ? 'default' : listMode;

  const mapPins = useMemo(() => layoutColocatedMapPins(expandMapPins(mapItems)), [mapItems]);

  const browseListBase = useMemo(() => {
    const timeBoundActivitiesForList = (catalog: ExploreMapItemDTO[]) => {
      const selected = selectActivitiesFromMapItems(catalog, {
        mapFilter,
        tripMapTopics,
        buddySubtype,
        outingTopic,
        query: '',
        activityDatePreset,
        activityModeFilter,
        priceFilter,
      });
      if (venueRegions.length === 0) return selected;
      return selected.filter((item) => venueItemMatchesRegions(item, venueRegions));
    };

    if (isDesktop) {
      if (desktopBrowseTab === 'activities') {
        return dedupeExploreListById(timeBoundActivitiesForList(items));
      }
      return dedupeExploreListById(
        selectPlacesFromMapItems(items, {
          mapFilter,
          venueFilter,
          placeMapTopics,
          venueRegions,
          hasTrip,
          facilityKinds,
        })
      );
    }

    if (sidebarPanel === 'venues') {
      return dedupeExploreListById(
        selectPlacesFromMapItems(items, {
          mapFilter,
          venueFilter,
          placeMapTopics,
          venueRegions,
          hasTrip,
          facilityKinds,
        })
      );
    }

    if (sidebarPanel === 'shops') {
      return dedupeExploreListById(selectShopsFromMapItems(items));
    }

    return dedupeExploreListById(timeBoundActivitiesForList(items));
  }, [
    items,
    mapFilter,
    venueFilter,
    tripMapTopics,
    placeMapTopics,
    activityDatePreset,
    venueRegions,
    isDesktop,
    desktopBrowseTab,
    sidebarPanel,
    buddySubtype,
    outingTopic,
    activityModeFilter,
    priceFilter,
    hasTrip,
    facilityKinds,
  ]);

  const listItems = useMemo(() => {
    if (browseListMode === 'people') return [];

    const hasQuery = query.trim().length > 0;
    const matchesQuery = (item: ExploreMapItemDTO) => exploreItemMatchesQuery(item, query);

    /** Panel search — filter the active tab list; ignore stale mobile `searchScope` on desktop. */
    if (hasQuery && isDesktop) {
      return dedupeExploreListById(browseListBase.filter(matchesQuery));
    }

    const activitySearchPool = () => {
      const selected = selectActivitiesFromMapItems(items, {
        mapFilter,
        buddySubtype,
        outingTopic,
        query: '',
        activityDatePreset,
        activityModeFilter,
        priceFilter,
      });
      if (venueRegions.length === 0) return selected;
      return selected.filter((item) => venueItemMatchesRegions(item, venueRegions));
    };

    const hostedTripsPool = () =>
      activitySearchPool().filter((item) => mapItemMatchesSearchScope(item, 'activities'));

    const peopleListPool = () =>
      activitySearchPool().filter((item) => mapItemMatchesSearchScope(item, 'people'));

    const placesListPool = () =>
      selectPlacesFromMapItems(items, {
        mapFilter,
        venueRegions,
        hasTrip,
        facilityKinds,
      });

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
      return selectShopsFromMapItems(items).filter(matchesQuery);
    }

    if (hasQuery && searchScope === 'agencies') {
      return sortExploreVenues(
        items.filter((item) => mapItemIsAgencyHostedActivity(item)).filter(matchesQuery)
      );
    }

    if (hasQuery && searchScope === null) {
      const pool = dedupeExploreListById([...activitySearchPool(), ...placesListPool()]);
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
    activityModeFilter,
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
