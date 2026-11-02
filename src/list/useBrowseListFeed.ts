import { useMemo } from 'react';
import { setExploreClockStyle } from '@uaetrail/shared-types';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { useAuth } from '../context/AuthContext';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { useExploreMap } from '../hooks/useExploreMap';
import { buildListFeedCards } from './buildListFeedCards';
import {
  cardMatchesBrowsePrice,
  filterExploreMapItemsForList,
  type BrowseListFilterState,
} from './browseListFilters';

type UseBrowseListFeedArgs = {
  filters: BrowseListFilterState;
  venueRegions: string[];
  /** Buddies category uses member-discovery only — skip map fetch. */
  mapEnabled?: boolean;
};

export const useBrowseListFeed = ({
  filters,
  venueRegions,
  mapEnabled = true,
}: UseBrowseListFeedArgs) => {
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const { data: items = [], isError, error, refetch, isFetching, isPending } = useExploreMap({
    enabled: mapEnabled,
    projection: 'list',
  });
  const feedLoading = mapEnabled && isPending && items.length === 0;

  const filteredItems = useMemo(
    () => (mapEnabled ? filterExploreMapItemsForList(items, filters, venueRegions) : []),
    [mapEnabled, items, filters, venueRegions]
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
    items: mapEnabled ? items : [],
    isLoading: feedLoading,
    isError: mapEnabled ? isError : false,
    error: mapEnabled ? error : null,
    refetch,
    isFetching: mapEnabled ? isFetching : false,
    itemCount: mapEnabled ? items.length : 0,
  };
};
