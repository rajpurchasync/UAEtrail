import { useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { buildExploreCardModel, type ExploreCardModel } from '../explore/exploreCardModel';
import { useExploreMap } from '../hooks/useExploreMap';
import { buildVenueCoverByLocationId, enrichBrowsePosterCover } from './browsePosterCover';
import { enrichListFeedCardModel } from './enrichListFeedCard';
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
  const { data: items = [], isLoading, isError, error, refetch, isFetching } = useExploreMap();

  const venueCoverByLocationId = useMemo(() => buildVenueCoverByLocationId(items), [items]);

  const filteredItems = useMemo(
    () => filterExploreMapItemsForList(items, filters, venueRegions),
    [items, filters, venueRegions]
  );

  const cards: ExploreCardModel[] = useMemo(() => {
    const built = filteredItems
      .map((item: ExploreMapItemDTO) => {
        const card = enrichBrowsePosterCover(buildExploreCardModel(item), venueCoverByLocationId);
        return enrichListFeedCardModel(card, item, items, user);
      });
    return built.filter((card) => cardMatchesBrowsePrice(card, filters.price));
  }, [filteredItems, filters.price, venueCoverByLocationId, items, user]);

  return {
    cards,
    items,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    itemCount: items.length,
  };
};
