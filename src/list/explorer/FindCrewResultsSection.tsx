import { useMemo } from 'react';
import type { ExploreClockStyle, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreActivityDate';
import type { CrewBrowseLane, CrewPeopleFacet, CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import type { BrowseListFilterState } from '@/discovery/discoveryPortListFilters';
import { CrewsTabBody } from '@/discovery/discoveryPortListFindCrew';
import type { CrewsAvailabilityGuideFilter, CrewsAvailabilityShapeFilter } from '@/discovery/discoveryPortListFindCrew';
import { DEFAULT_CREW_PEOPLE_FACET } from '@/crew-discovery/crewBrowseState';
import { useCrewDiscoveryAvailability } from '@/crew-discovery/hooks/useCrewDiscoveryAvailability';
import { BrowseCompactRow } from '@/discovery/discoveryPortListFeed';
import { ExploreGuestSignInCard } from '@/discovery/discoveryPortExploreGuest';
import {
  EXPLORE_SEARCH_MATCHES_TITLE,
  exploreSearchComposeFeedMode,
  exploreSearchWhereBrowseQuery,
  resolveExploreSearchDetectedWhereQuery,
  resolveExploreSearchJoinableTripCards,
  useExploreSearchCommunityGroups,
} from '@/discovery/discoveryPortExploreSearch';
import { FEATURE_FLAGS } from '@/config/platform';
import { FindCrewMainTabs } from './FindCrewMainTabs';
import {
  findCrewNavToBrowsePatch,
  parseFindCrewRecommendedLaneFromBrowse,
} from './findCrewNavWire';
import {
  FIND_CREW_COMMUNITIES_EMPTY,
  FIND_CREW_RECOMMENDED_TITLE,
  FIND_CREW_TRIPS_HOSTED_EMPTY,
} from './findCrewSearchCopy';
import { useCrewDiscoveryNetworkPreview } from '@/crew-discovery/hooks/useCrewDiscoveryNetworkPreview';
import { FIND_CREW_DEV_PREVIEW_PEOPLE } from './findCrewAvailabilityDevPreview';
import { mergeVenueStateFilterOptionsWithDestinations } from '@/config/regions';
import { FindCrewCommunityList } from './FindCrewCommunityCard';
import type { FindCrewRecommendedTab } from './findCrewRecommendedTabs';

type FindCrewResultsSectionProps = {
  user: { id: string } | null | undefined;
  isSignedIn: boolean;
  draftQuery: string;
  committedQuery: string;
  filters: BrowseListFilterState;
  activityDatePreset: ExploreActivityDatePreset;
  venueRegions: string[];
  geoPath: string[];
  clock: ExploreClockStyle;
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  availabilityCatalogItems: ExploreMapItemDTO[];
  crewsOpenLens: CrewsAvailabilityShapeFilter;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  onOpenIntentOpen: () => void;
  onSyncBrowse: (patch: {
    crewBrowseLane?: CrewBrowseLane;
    crewPeopleFacet?: CrewPeopleFacet;
    crewProfessionalKind?: CrewProfessionalKind;
    tripAvailabilityOnly?: boolean;
  }) => void;
};

const mergeDevPreviewPeople = (
  people: ReturnType<typeof useCrewDiscoveryAvailability>['people'],
  loading: boolean,
  error: string | null
) => {
  if (!import.meta.env.DEV || loading || error || people.length > 0) return people;
  return FIND_CREW_DEV_PREVIEW_PEOPLE;
};

export const FindCrewResultsSection = ({
  user,
  isSignedIn,
  draftQuery,
  committedQuery,
  filters,
  activityDatePreset,
  venueRegions,
  geoPath,
  clock,
  exploreCatalogItems,
  exploreCatalogLoading,
  availabilityCatalogItems,
  crewsOpenLens,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  onOpenIntentOpen,
  onSyncBrowse,
}: FindCrewResultsSectionProps) => {
  const queryForFeed = committedQuery.trim() || draftQuery;
  const detectedWhere = useMemo(() => resolveExploreSearchDetectedWhereQuery(), []);
  const feedMode = exploreSearchComposeFeedMode(queryForFeed, committedQuery, detectedWhere);
  const sectionTitle =
    feedMode === 'recommend' ? FIND_CREW_RECOMMENDED_TITLE : EXPLORE_SEARCH_MATCHES_TITLE;
  const search = exploreSearchWhereBrowseQuery(queryForFeed);
  const regionFilter = useMemo(() => {
    const key = venueRegions[0]?.trim();
    if (!key) return null;
    const option = mergeVenueStateFilterOptionsWithDestinations([], 'AE').find(
      (entry) => entry.key.toLowerCase() === key.toLowerCase()
    );
    return option?.label ?? key;
  }, [venueRegions]);
  const tab = parseFindCrewRecommendedLaneFromBrowse({ lane: filters.crewBrowseLane });

  const availability = useCrewDiscoveryAvailability({
    enabled: tab === 'people',
    search,
    activityDatePreset,
    region: regionFilter,
    mapFilter: 'all',
  });

  const networkPreview = useCrewDiscoveryNetworkPreview(isSignedIn && tab === 'people');
  const followedUserIds = useMemo(
    () => new Set(networkPreview.preview?.followedUserIds ?? []),
    [networkPreview.preview?.followedUserIds]
  );

  const peopleForList = useMemo(
  () => mergeDevPreviewPeople(availability.people, availability.loading, availability.error),
    [availability.people, availability.loading, availability.error]
  );

  const communityGroups = useExploreSearchCommunityGroups({
    enabled: tab === 'community',
    feedMode: feedMode === 'recommend' ? 'recommend' : 'matches',
    draftQuery: queryForFeed,
    detectedWhere,
    committedWhere: committedQuery,
    venueRegions,
    limit: 24,
  });

  const tripCards = useMemo(() => {
    if (tab !== 'trips') return [];
    const tripFilters: BrowseListFilterState = {
      ...filters,
      query: queryForFeed,
      categories: ['activities'],
      tripAvailabilityOnly: false,
    };
    return resolveExploreSearchJoinableTripCards(
      exploreCatalogItems,
      user ?? null,
      clock,
      tripFilters,
      venueRegions,
      queryForFeed,
      24,
      geoPath,
      [],
      committedQuery.trim() ? 'query' : 'recommend'
    ).cards;
  }, [tab, filters, queryForFeed, exploreCatalogItems, user, clock, venueRegions, geoPath, committedQuery]);

  const applyMain = (next: FindCrewRecommendedTab) => {
    onSyncBrowse(findCrewNavToBrowsePatch(next));
  };

  return (
    <section className="min-w-0 space-y-3" aria-labelledby="find-crew-results-heading">
      <h2 id="find-crew-results-heading" className="text-sm font-bold text-neutral-900">
        {sectionTitle}
      </h2>
      <FindCrewMainTabs active={filters.crewBrowseLane} onChange={applyMain} />

      {tab === 'people' ? (
        <>
          {!isSignedIn && peopleForList.length === 0 && !availability.loading ? (
            <ExploreGuestSignInCard intent="explore-people-browse" compact />
          ) : null}
          <CrewsTabBody
            lane="people"
            facet={DEFAULT_CREW_PEOPLE_FACET}
            professionalKind={filters.crewProfessionalKind}
            availabilityShape={crewsOpenLens}
            crewsAvailabilityGuideFilter={'all' satisfies CrewsAvailabilityGuideFilter}
            onCrewsAvailabilityGuideFilterChange={() => undefined}
            isSignedIn={isSignedIn}
            availabilityPeople={peopleForList}
            availabilityLoading={availability.loading}
            availabilityError={availability.error}
            friendsGoing={[]}
            hostsGoing={[]}
            followed={[]}
            directory={[]}
            discoveryQuota={null}
            discoveryLoading={false}
            discoveryError={null}
            availabilityCatalogItems={availabilityCatalogItems}
            exploreCatalogItems={exploreCatalogItems}
            exploreCatalogLoading={exploreCatalogLoading}
            onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
            onOpenAvailability={onOpenIntentOpen}
            memberAvailabilityRowsOnly
            followedUserIds={followedUserIds}
            activityDatePreset={activityDatePreset}
          />
        </>
      ) : null}

      {tab === 'community' && FEATURE_FLAGS.communityDiscover ? (
        communityGroups.loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-neutral-100" aria-hidden />
        ) : communityGroups.rows.length > 0 ? (
          <FindCrewCommunityList rows={communityGroups.rows} />
        ) : (
          <p className="text-sm text-neutral-500">{FIND_CREW_COMMUNITIES_EMPTY}</p>
        )
      ) : null}

      {tab === 'trips' ? (
        exploreCatalogLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-neutral-100" aria-hidden />
        ) : tripCards.length > 0 ? (
          <ul className="space-y-2">
            {tripCards.map((card) => (
              <li key={card.id}>
                <BrowseCompactRow card={card} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">{FIND_CREW_TRIPS_HOSTED_EMPTY}</p>
        )
      ) : null}
    </section>
  );
};