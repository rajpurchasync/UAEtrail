import { useMemo } from 'react';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';
import { FEATURE_FLAGS } from '../../config/platform';
import { filterCommunityDiscoverCards } from './filterCommunityDiscoverCards';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import { exploreSearchWhereEffectiveQuery } from './exploreSearchWhereDisplay';
import { EXPLORE_SEARCH_COMPOSE_MATCH_LIMIT } from './exploreSearchHomeCopy';
import { EXPLORE_SEARCH_HOME_UPCOMING_LIMIT } from './exploreSearchUpcomingTrips';
import type { ExploreSearchComposeFeedMode } from './exploreSearchComposeMode';

type UseExploreSearchCommunityGroupsInput = {
  enabled: boolean;
  feedMode: ExploreSearchComposeFeedMode;
  draftQuery: string;
  detectedWhere: string;
  committedWhere: string;
  venueRegions: string[];
  limit?: number;
};

export const useExploreSearchCommunityGroups = ({
  enabled,
  feedMode,
  draftQuery,
  detectedWhere,
  committedWhere,
  venueRegions,
  limit,
}: UseExploreSearchCommunityGroupsInput) => {
  const active = enabled && FEATURE_FLAGS.communityDiscover;
  const listQuery = useCommunityDiscoverList(active);

  const queryForFilter = useMemo(() => {
    if (feedMode === 'recommend') return '';
    return exploreSearchWhereBrowseQuery(
      exploreSearchWhereEffectiveQuery(draftQuery, committedWhere || detectedWhere)
    );
  }, [committedWhere, detectedWhere, draftQuery, feedMode]);

  const filtered = useMemo(
    () => filterCommunityDiscoverCards(listQuery.data ?? [], { query: queryForFilter, venueRegions }),
    [listQuery.data, queryForFilter, venueRegions]
  );

  const rowLimit =
    limit ?? (feedMode === 'recommend' ? EXPLORE_SEARCH_HOME_UPCOMING_LIMIT : EXPLORE_SEARCH_COMPOSE_MATCH_LIMIT);

  const rows = useMemo(() => filtered.slice(0, rowLimit), [filtered, rowLimit]);

  return {
    rows,
    totalCount: filtered.length,
    loading: active && listQuery.isPending,
    enabled: active,
  };
};