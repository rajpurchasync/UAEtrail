import { useMemo } from 'react';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useBrowseListFeed } from '../../list/useBrowseListFeed';
import type { BrowseListFilterState } from '../../list/browseListFilters';
import { scopeBrowseListStateForListCat } from '../../list/browseListMapHandoff';
import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { parseBrowseListFilterState, parseBrowseListGeoPath } from '../../list/browseListUrlState';
import { useBrowseGeoScopeHydration } from '../../list/useBrowseGeoScopeHydration';
import { resolveEffectiveBrowseVenueRegions } from '../../list/browseGeoPath';
import { useExplorePublishedAreasQuery } from '../useExplorePublishedAreas';
import {
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from './exploreSearchJoinablePools';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
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
  tripAvailabilityOnly: false,
  placeTopics: [],
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  peopleBrowseTab: 'hub',
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
  const geoPath = useMemo(() => parseBrowseListGeoPath(searchParams), [searchParams]);
  useBrowseGeoScopeHydration(geoPath);
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery();
  const hubVenueRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedAreas),
    [venueRegions, geoPath, publishedAreas]
  );
  const browseQuery = searchState.query.trim() || parsedFilters.query;

  const { items, isLoading } = useBrowseListFeed({
    filters: catalogFilters(),
    venueRegions,
    geoPath,
  });

  const tripScoped = useMemo(
    () =>
      scopeBrowseListStateForListCat(
        {
          ...parsedFilters,
          query: exploreSearchWhereBrowseQuery(browseQuery),
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
          query: exploreSearchWhereBrowseQuery(browseQuery),
          categories: ['venues'],
        },
        'venues'
      ),
    [browseQuery, parsedFilters]
  );

  const tripListingCount = useMemo(
    () => resolveExploreSearchTripPool(items, tripScoped, hubVenueRegions, geoPath, publishedAreas).pool.length,
    [geoPath, hubVenueRegions, items, publishedAreas, tripScoped]
  );

  const placeListingCount = useMemo(
    () => resolveExploreSearchVenuePool(items, placeScoped, hubVenueRegions, geoPath, publishedAreas).pool.length,
    [geoPath, hubVenueRegions, items, placeScoped, publishedAreas]
  );

  const crewCount = useMemo(() => {
    const q = exploreSearchWhereBrowseQuery(browseQuery);
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