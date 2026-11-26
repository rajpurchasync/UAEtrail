import { useMemo } from 'react';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';
import { CommunityDiscoverBrowseList } from '@/discovery/discoveryPortListExperience';
import { FEATURE_FLAGS } from '../../config/platform';
import { filterCommunityDiscoverCards } from './filterCommunityDiscoverCards';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import { EXPLORE_SEARCH_MATCHES_EMPTY, EXPLORE_SEARCH_RECOMMENDED_EMPTY } from './exploreSearchHomeCopy';

type ExploreSearchCommunityGroupsPaneProps = {
  query: string;
  venueRegions: string[];
  recommend?: boolean;
};

export const ExploreSearchCommunityGroupsPane = ({
  query,
  venueRegions,
  recommend = false,
}: ExploreSearchCommunityGroupsPaneProps) => {
  const active = FEATURE_FLAGS.communityDiscover;
  const { data, isPending, error } = useCommunityDiscoverList(active);

  const filtered = useMemo(() => {
    const q = recommend ? '' : exploreSearchWhereBrowseQuery(query);
    return filterCommunityDiscoverCards(data ?? [], { query: q, venueRegions });
  }, [data, query, recommend, venueRegions]);

  if (!active) {
    return <p className="px-1 text-sm text-neutral-500">Community groups are not available in this build.</p>;
  }

  if (isPending) {
    return <div className="h-24 animate-pulse rounded-xl bg-neutral-100" aria-hidden />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Could not load communities. Try again in a moment.</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {recommend ? EXPLORE_SEARCH_RECOMMENDED_EMPTY : EXPLORE_SEARCH_MATCHES_EMPTY}
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <CommunityDiscoverBrowseList rows={filtered} />
    </div>
  );
};

/** Count helper for search chrome — keep in sync with {@link filterCommunityDiscoverCards}. */
export const countExploreSearchCommunityGroups = (
  rows: Parameters<typeof filterCommunityDiscoverCards>[0],
  query: string,
  venueRegions: string[]
): number => filterCommunityDiscoverCards(rows, { query: exploreSearchWhereBrowseQuery(query), venueRegions }).length;