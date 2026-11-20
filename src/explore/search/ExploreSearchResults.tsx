import { useMemo } from 'react';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useBrowseListFeed } from '../../list/useBrowseListFeed';
import type { BrowseListFilterState } from '../../list/browseListFilters';
import { scopeBrowseListStateForListCat } from '../../list/browseListMapHandoff';
import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { parseBrowseListFilterState } from '../../list/browseListUrlState';
import { resolveExploreHubTripPool, resolveExploreHubVenuePool } from '../hub/exploreHubJoinableTrips';
import { exploreHubWhereBrowseQuery } from '../hub/exploreHubWhereDisplay';
import { parseExploreSearchBrowseState, type ExploreSearchBrowseState } from './exploreSearchRouting';
import { ExploreSearchResultsChrome } from './ExploreSearchResultsChrome';
import { exploreItemMatchesQuery } from '../exploreItemSearch';
import { mapItemMatchesSearchScope } from '../exploreBrowseTaxonomy';

type ExploreSearchResultsProps = {
  state?: ExploreSearchBrowseState;
};

const catalogFilters = (): BrowseListFilterState => ({
  query: '',
  categories: ['activities'],
  tripTopics: [],
  tripLookingOnly: false,
  placeTopics: [],
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'hub',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
});

export const ExploreSearchResults = ({ state: stateProp }: ExploreSearchResultsProps) => {
  const [searchParams] = useProductSearchParams();
  const searchState = useMemo(
    () => stateProp ?? parseExploreSearchBrowseState(searchParams),
    [searchParams, stateProp]
  );

  const parsedFilters = useMemo(() => parseBrowseListFilterState(searchParams), [searchParams]);
  const venueRegions = searchState.venueRegions;
  const browseQuery = searchState.query.trim() || parsedFilters.query;

  const { items, isLoading } = useBrowseListFeed({
    filters: catalogFilters(),
    venueRegions,
  });

  const tripScoped = useMemo(
    () =>
      scopeBrowseListStateForListCat(
        {
          ...parsedFilters,
          query: exploreHubWhereBrowseQuery(browseQuery),
          activityDatePreset: searchState.activityDatePreset,
          categories: ['activities'],
        },
        'activities'
      ),
    [browseQuery, searchState.activityDatePreset, parsedFilters]
  );

  const placeScoped = useMemo(
    () =>
      scopeBrowseListStateForListCat(
        {
          ...parsedFilters,
          query: exploreHubWhereBrowseQuery(browseQuery),
          categories: ['venues'],
        },
        'venues'
      ),
    [browseQuery, parsedFilters]
  );

  const tripListingCount = useMemo(
    () => resolveExploreHubTripPool(items, tripScoped, venueRegions).pool.length,
    [items, tripScoped, venueRegions]
  );

  const placeListingCount = useMemo(
    () => resolveExploreHubVenuePool(items, placeScoped, venueRegions).pool.length,
    [items, placeScoped, venueRegions]
  );

  const crewCount = useMemo(() => {
    const q = exploreHubWhereBrowseQuery(browseQuery);
    if (!q.trim()) return 0;
    let count = 0;
    for (const item of items) {
      if (!exploreItemMatchesQuery(item, q)) continue;
      if (mapItemMatchesSearchScope(item, 'people')) count += 1;
    }
    return count;
  }, [browseQuery, items]);

  return (
    <div
      data-explore-search-layout="unified"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-2 pt-0 md:px-5">
        <ExploreSearchResultsChrome
          state={searchState}
          tripCount={tripListingCount}
          placeCount={placeListingCount}
          loading={isLoading}
          crewCount={crewCount}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-nav-safe md:px-5">
        <ListDiscoveryExperience surface="exploreSearch" />
      </div>
    </div>
  );
};