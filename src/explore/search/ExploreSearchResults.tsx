import { useMemo } from 'react';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useBrowseListFeed } from '../../list/browse/useBrowseListFeed';
import type { BrowseListFilterState } from '../../list/browse/browseListFilters';
import { scopeBrowseListStateForListCat } from '../../list/browse/browseListMapHandoff';
import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { parseBrowseListFilterState, parseBrowseListGeoPath } from '../../list/browse/browseListUrlState';
import { useBrowseGeoScopeHydration } from '../../list/browse/useBrowseGeoScopeHydration';
import { resolveEffectiveBrowseVenueRegions } from '../../list/browse/browseGeoPath';
import { useExplorePublishedDestinationsQuery } from '../useExplorePublishedDestinations';
import {
  resolveExploreSearchTripPool,
  resolveExploreSearchVenuePool,
} from './exploreSearchJoinablePools';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import { parseExploreSearchBrowseState, type ExploreSearchBrowseState } from './exploreSearchRouting';
import { ExploreSearchResultsChrome } from './ExploreSearchResultsChrome';
import { useAuth } from '../../context/AuthContext';
import { useExploreSearchRecommendedCrew } from './useExploreSearchRecommendedCrew';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';
import { countExploreSearchCommunityGroups, ExploreSearchCommunityGroupsPane } from './ExploreSearchCommunityGroupsPane';
import { FEATURE_FLAGS } from '../../config/platform';

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
  crewBrowseLane: 'people',
  crewPeopleFacet: 'available',
  crewPeopleSurface: 'find',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
});

export const ExploreSearchResults = ({ state: stateProp }: ExploreSearchResultsProps) => {
  const { user } = useAuth();
  const [searchParams] = useProductSearchParams();
  const searchState = useMemo(
    () => stateProp ?? parseExploreSearchBrowseState(searchParams),
    [searchParams, stateProp]
  );

  const parsedFilters = useMemo(() => parseBrowseListFilterState(searchParams), [searchParams]);
  const venueRegions = searchState.venueRegions;
  const geoPath = useMemo(() => parseBrowseListGeoPath(searchParams), [searchParams]);
  useBrowseGeoScopeHydration(geoPath);
  const { data: publishedAreas = [] } = useExplorePublishedDestinationsQuery();
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

  const crewRecommendations = useExploreSearchRecommendedCrew({
    enabled: searchState.searchScope === 'crew',
    draftQuery: searchState.query,
    detectedWhere: searchState.query,
    activityDatePreset: searchState.activityDatePreset,
    venueRegions: hubVenueRegions,
    limit: 48,
  });

  const crewCount =
    searchState.searchScope === 'crew' && user ? crewRecommendations.totalCount : 0;

  const communitiesQuery = useCommunityDiscoverList(FEATURE_FLAGS.communityDiscover);
  const groupsCount = useMemo(() => {
    if (!FEATURE_FLAGS.communityDiscover) return 0;
    return countExploreSearchCommunityGroups(
      communitiesQuery.data ?? [],
      exploreSearchWhereBrowseQuery(searchState.query),
      hubVenueRegions
    );
  }, [communitiesQuery.data, hubVenueRegions, searchState.query]);

  return (
    <div
      data-explore-search-layout="unified"
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <ExploreSearchResultsChrome
        state={searchState}
        tripCount={tripListingCount}
        placeCount={placeListingCount}
        loading={isLoading}
        crewCount={crewCount}
        groupsCount={groupsCount}
        groupsLoading={communitiesQuery.isPending}
      />
      {searchState.searchScope === 'groups' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-4">
          <ExploreSearchCommunityGroupsPane query={searchState.query} venueRegions={hubVenueRegions} />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ListDiscoveryExperience surface="exploreSearch" />
        </div>
      )}
    </div>
  );
};