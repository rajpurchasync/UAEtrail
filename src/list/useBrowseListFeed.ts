import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ExploreCardModel } from '../explore/exploreCardModel';
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
};

export const useBrowseListFeed = ({ filters, venueRegions }: UseBrowseListFeedArgs) => {
  const { user } = useAuth();
  const { data: items = [], isError, error, refetch, isFetching, isPending } = useExploreMap();
  const feedLoading = isPending && items.length === 0;

  const filteredItems = useMemo(
    () => filterExploreMapItemsForList(items, filters, venueRegions),
    [items, filters, venueRegions]
  );

  const cards: ExploreCardModel[] = useMemo(() => {
    const built = buildListFeedCards(filteredItems, user, items);
    return built.filter((card) => cardMatchesBrowsePrice(card, filters.price));
  }, [filteredItems, filters.price, items, user]);

  return {
    cards,
    items,
    isLoading: feedLoading,
    isError,
    error,
    refetch,
    isFetching,
    itemCount: items.length,
  };
};
