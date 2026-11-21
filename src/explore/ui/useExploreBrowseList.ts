import { useMemo } from 'react';
import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { deriveVenueRegionSortOrder, sortExploreActivities, sortExploreVenues } from '../exploreListSort';
import { useExplorePublishedAreasQuery } from '../useExplorePublishedAreas';
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
import { exploreItemMatchesBrowseGeoPath, resolveEffectiveBrowseVenueRegions } from '../../list/browseGeoPath';
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
  geoPath?: string[];
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

const listFromPool = (
  pool: ExploreMapItemDTO[],
  matchesQuery: (item: ExploreMapItemDTO) => boolean,
  regionOrder: readonly string[]
) => {
  const matching = dedupeExploreListById(pool.filter(matchesQuery));
  const plans = matching.filter((item) => isTimeBoundExploreMapItem(item));
  const spots = matching.filter((item) => mapItemMatchesSearchScope(item, 'places'));
  const shops = matching.filter((item) => mapItemMatchesSearchScope(item, 'shops'));
  return dedupeExploreListById([
    ...sortExploreActivities(plans),
    ...sortExploreVenues([...spots, ...shops], regionOrder),
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
  geoPath = [],
}: UseExploreBrowseListArgs) => {
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery();
  const venueRegionOrder = useMemo(
    () => deriveVenueRegionSortOrder(publishedAreas),
    [publishedAreas]
  );
  const effectiveVenueRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedAreas),
    [venueRegions, geoPath, publishedAreas]
  );
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
      venueRegions: effectiveVenueRegions,
      activityDatePreset,
      buddySubtype,
      outingTopic,
      activityModeFilter,
      priceFilter,
      hasTrip,
      facilityKinds,
      venueRegionOrder,
    });
    if (query.trim()) {
      pool = pool.filter((item) => exploreItemMatchesQuery(item, query));
    }
    if (geoPath.length > 0) {
      pool = pool.filter((item) => exploreItemMatchesBrowseGeoPath(item, geoPath, publishedAreas));
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
    effectiveVenueRegions,
    buddySubtype,
    outingTopic,
    activityModeFilter,
    priceFilter,
    hasTrip,
    facilityKinds,
    venueRegionOrder,
    geoPath,
    publishedAreas,
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
      if (effectiveVenueRegions.length === 0) return selected;
      return selected.filter((item) => venueItemMatchesRegions(item, effectiveVenueRegions));
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
          venueRegions: effectiveVenueRegions,
          hasTrip,
          facilityKinds,
          venueRegionOrder,
        })
      );
    }

    if (sidebarPanel === 'venues') {
      return dedupeExploreListById(
        selectPlacesFromMapItems(items, {
          mapFilter,
          venueFilter,
          placeMapTopics,
          venueRegions: effectiveVenueRegions,
          hasTrip,
          facilityKinds,
          venueRegionOrder,
        })
      );
    }

    if (sidebarPanel === 'shops') {
      return dedupeExploreListById(selectShopsFromMapItems(items, venueRegionOrder));
    }

    return dedupeExploreListById(timeBoundActivitiesForList(items));
  }, [
    items,
    mapFilter,
    venueFilter,
    tripMapTopics,
    placeMapTopics,
    activityDatePreset,
    effectiveVenueRegions,
    isDesktop,
    desktopBrowseTab,
    sidebarPanel,
    buddySubtype,
    outingTopic,
    activityModeFilter,
    priceFilter,
    hasTrip,
    facilityKinds,
    venueRegionOrder,
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
      if (effectiveVenueRegions.length === 0) return selected;
      return selected.filter((item) => venueItemMatchesRegions(item, effectiveVenueRegions));
    };

    const hostedTripsPool = () =>
      activitySearchPool().filter((item) => mapItemMatchesSearchScope(item, 'activities'));

    const peopleListPool = () =>
      activitySearchPool().filter((item) => mapItemMatchesSearchScope(item, 'people'));

    const placesListPool = () =>
      selectPlacesFromMapItems(items, {
        mapFilter,
        venueRegions: effectiveVenueRegions,
        hasTrip,
        facilityKinds,
        venueRegionOrder,
      });

    if (hasQuery && searchScope === 'activities') {
      return sortExploreActivities(hostedTripsPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'people') {
      return sortExploreActivities(peopleListPool().filter(matchesQuery));
    }

    if (hasQuery && searchScope === 'places') {
      return sortExploreVenues(placesListPool().filter(matchesQuery), venueRegionOrder);
    }

    if (hasQuery && searchScope === 'shops') {
      return selectShopsFromMapItems(items, venueRegionOrder).filter(matchesQuery);
    }

    if (hasQuery && searchScope === 'agencies') {
      return sortExploreVenues(
        items.filter((item) => mapItemIsAgencyHostedActivity(item)).filter(matchesQuery),
        venueRegionOrder
      );
    }

    if (hasQuery && searchScope === null) {
      const pool = dedupeExploreListById([...activitySearchPool(), ...placesListPool()]);
      return listFromPool(pool, matchesQuery, venueRegionOrder);
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
    venueRegionOrder,
    priceFilter,
    hasTrip,
    facilityKinds,
  ]);

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(items, query, activityDatePreset, effectiveVenueRegions),
    [items, query, activityDatePreset, effectiveVenueRegions]
  );

  const shopListSections = useMemo(() => {
    const inPlacesContext = isDesktop ? desktopBrowseTab === 'venues' : sidebarPanel === 'venues' || sidebarPanel === 'shops';
    if (!inPlacesContext || !listItems.some(isShopListItem)) return null;
    /** Physical vs online split is for shops-only browse — not the mixed "All places" list. */
    const shopsOnlyView = mapFilter === 'shops' || sidebarPanel === 'shops';
    if (!shopsOnlyView) return null;
    const physical = sortExploreVenues(listItems.filter(isPhysicalShopItem), venueRegionOrder);
    const online = sortExploreVenues(listItems.filter(isOnlineShopItem), venueRegionOrder);
    return { physical, online };
  }, [listItems, isDesktop, desktopBrowseTab, sidebarPanel, mapFilter, venueRegionOrder]);

  return {
    mapPins,
    listItems,
    shopListSections,
    searchScopeCounts,
  };
};
