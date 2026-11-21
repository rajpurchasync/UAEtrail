import { useMemo } from 'react';
import { setExploreClockStyle } from '@uaetrail/shared-types';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { useAuth } from '../context/AuthContext';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useExploreMap } from '../hooks/useExploreMap';
import { buildListFeedCards } from './buildListFeedCards';
import {
  cardMatchesBrowsePrice,
  filterExploreMapItemsForList,
  type BrowseListFilterState,
} from './browseListFilters';
import { useExplorePublishedAreasQuery } from '../explore/useExplorePublishedAreas';
import { resolveEffectiveBrowseVenueRegions } from './browseGeoPath';

type UseBrowseListFeedArgs = {
  filters: BrowseListFilterState;
  venueRegions: string[];
  /** Slash path (`?geo=`) — filters catalog rows under a geo drill. */
  geoPath?: string[];
  /** Buddies category uses member-discovery only — skip map fetch. */
  mapEnabled?: boolean;
  /** When embedded on explore, reuse the map catalog instead of a second fetch. */
  catalogItems?: ExploreMapItemDTO[];
};

export const useBrowseListFeed = ({
  filters,
  venueRegions,
  geoPath = [],
  mapEnabled = true,
  catalogItems,
}: UseBrowseListFeedArgs) => {
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery(mapEnabled);
  const effectiveRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedAreas),
    [venueRegions, geoPath, publishedAreas]
  );
  const useExternalCatalog = catalogItems !== undefined && mapEnabled;
  const { data: fetchedItems = [], isError, error, refetch, isFetching, isPending } = useExploreMap({
    enabled: mapEnabled && !useExternalCatalog,
    projection: 'list',
  });
  const items = useExternalCatalog ? catalogItems : fetchedItems;
  const feedLoading = mapEnabled && !useExternalCatalog && isPending && items.length === 0;

  const filteredItems = useMemo(
    () =>
      mapEnabled
        ? filterExploreMapItemsForList(items, filters, effectiveRegions, geoPath, publishedAreas)
        : [],
    [mapEnabled, items, filters, effectiveRegions, geoPath, publishedAreas]
  );

  const cards: DiscoveryCardModel[] = useMemo(() => {
    if (!mapEnabled) return [];
    setExploreClockStyle(clock);
    const built = buildListFeedCards(filteredItems, user, items);
    const tripsInScope =
      filters.categories.length === 0 || filters.categories.includes('activities');
    return tripsInScope ? built.filter((card) => cardMatchesBrowsePrice(card, filters.price)) : built;
  }, [mapEnabled, filteredItems, filters.categories, filters.price, items, user, clock]);

  return {
    cards,
    filteredItems,
    items: mapEnabled ? items : [],
    isLoading: feedLoading,
    isError: mapEnabled ? isError : false,
    error: mapEnabled ? error : null,
    refetch,
    isFetching: mapEnabled ? isFetching : false,
    itemCount: mapEnabled ? items.length : 0,
  };
};
