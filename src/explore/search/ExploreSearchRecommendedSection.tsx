import { useMemo } from 'react';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { ExploreSearchScope } from './exploreSearchRouting';
import { useAuth } from '../../context/AuthContext';
import { useExploreMap } from '../../hooks/useExploreMap';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';
import {
  BrowseCompactRow,
  scopeBrowseListStateForListCat,
  type BrowseListFilterState,
} from '../../discovery/discoverySession';
import {
  exploreSearchTripRelaxationCopy,
  resolveExploreSearchJoinableTripCards,
  resolveExploreSearchVenueCards,
} from './exploreSearchJoinablePools';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import { exploreSearchWhereEffectiveQuery } from './exploreSearchWhereDisplay';
import { EXPLORE_SEARCH_HOME_UPCOMING_LIMIT } from './exploreSearchUpcomingTrips';
import type { ExploreSearchComposeFeedMode } from './exploreSearchComposeMode';
import {
  EXPLORE_SEARCH_COMPOSE_MATCH_LIMIT,
  EXPLORE_SEARCH_MATCHES_EMPTY,
  EXPLORE_SEARCH_MATCHES_TITLE,
  EXPLORE_SEARCH_RECOMMENDED_EMPTY,
  EXPLORE_SEARCH_RECOMMENDED_TITLE,
} from './exploreSearchHomeCopy';
import { ExploreSearchRecommendedScopePills } from './ExploreSearchRecommendedScopePills';
import { useExploreSearchRecommendedCrew } from './useExploreSearchRecommendedCrew';
import { CrewBrowseMemberRow } from '@/crew-discovery/panel/crewBrowse/CrewBrowseMemberRow';
import { ExploreGuestSignInCard } from '../ui/ExploreGuestSignInCard';
import { useExploreSearchCommunityGroups } from './useExploreSearchCommunityGroups';
import { CommunityDiscoverBrowseList } from '@/discovery/discoveryPortListEmbed';
import { FEATURE_FLAGS } from '../../config/platform';

type ExploreSearchRecommendedSectionProps = {
  feedMode: ExploreSearchComposeFeedMode;
  searchScope: ExploreSearchScope;
  onScopeChange: (mode: ExploreSearchScope) => void;
  draftQuery: string;
  detectedWhere: string;
  committedWhere: string;
  activityDatePreset: ExploreActivityDatePreset;
  venueRegions: string[];
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
  crewProfessionalKind: 'all',
  crewPeopleSurface: 'find',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
});

export const ExploreSearchRecommendedSection = ({
  feedMode,
  searchScope,
  onScopeChange,
  draftQuery,
  detectedWhere,
  committedWhere,
  activityDatePreset,
  venueRegions,
}: ExploreSearchRecommendedSectionProps) => {
  const recommend = feedMode === 'recommend';
  const matchLimit = recommend ? EXPLORE_SEARCH_HOME_UPCOMING_LIMIT : EXPLORE_SEARCH_COMPOSE_MATCH_LIMIT;
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const catalogScope = searchScope !== 'crew' && searchScope !== 'groups';
  const { data: items = [], isLoading: mapLoading } = useExploreMap({
    enabled: catalogScope,
    projection: 'list',
  });

  const communityGroups = useExploreSearchCommunityGroups({
    enabled: searchScope === 'groups',
    feedMode,
    draftQuery,
    detectedWhere,
    committedWhere,
    venueRegions,
    limit: matchLimit,
  });

  const crewDraft = recommend ? '' : draftQuery;
  const crewDetected = recommend ? '' : detectedWhere;

  const crewFeed = useExploreSearchRecommendedCrew({
    enabled: searchScope === 'crew',
    draftQuery: crewDraft,
    detectedWhere: crewDetected,
    activityDatePreset,
    venueRegions,
    limit: matchLimit,
  });

  const browseQuery = useMemo(() => {
    if (recommend) return '';
    return exploreSearchWhereBrowseQuery(
      exploreSearchWhereEffectiveQuery(draftQuery, committedWhere || detectedWhere)
    );
  }, [committedWhere, detectedWhere, draftQuery, recommend]);

  const regionHint = draftQuery.trim() || committedWhere || detectedWhere;

  const { cards, hint } = useMemo(() => {
    if (searchScope === 'join') {
      const filters = scopeBrowseListStateForListCat(
        {
          ...catalogFilters(),
          query: browseQuery,
          activityDatePreset: recommend ? 'anyday' : activityDatePreset,
          categories: ['activities'],
        },
        'activities'
      );
      const { cards: tripCards, relaxation } = resolveExploreSearchJoinableTripCards(
        items,
        user,
        clock,
        filters,
        venueRegions,
        regionHint,
        matchLimit,
        [],
        [],
        recommend ? 'recommend' : 'query'
      );
      return { cards: tripCards, hint: exploreSearchTripRelaxationCopy(relaxation) };
    }

    if (searchScope === 'places') {
      const filters = scopeBrowseListStateForListCat(
        {
          ...catalogFilters(),
          query: browseQuery,
          categories: ['venues'],
        },
        'venues'
      );
      const { cards: venueCards, relaxed } = resolveExploreSearchVenueCards(
        items,
        user,
        clock,
        filters,
        venueRegions,
        matchLimit
      );
      const placeHint = relaxed ? 'No exact match for that place — showing spots across the UAE.' : null;
      return { cards: venueCards, hint: placeHint };
    }

    return { cards: [], hint: null as string | null };
  }, [
    activityDatePreset,
    browseQuery,
    clock,
    items,
    matchLimit,
    recommend,
    regionHint,
    searchScope,
    user,
    venueRegions,
  ]);

  const loading =
    searchScope === 'crew'
      ? crewFeed.loading
      : searchScope === 'groups'
        ? communityGroups.loading
        : mapLoading && cards.length === 0;

  const showCatalogEmpty =
    searchScope !== 'crew' && searchScope !== 'groups' && !loading && cards.length === 0;
  const showCrewEmpty =
    searchScope === 'crew' && crewFeed.signedIn && !loading && crewFeed.rows.length === 0;
  const showGroupsEmpty =
    searchScope === 'groups' && communityGroups.enabled && !loading && communityGroups.rows.length === 0;

  const sectionTitle = recommend ? EXPLORE_SEARCH_RECOMMENDED_TITLE : EXPLORE_SEARCH_MATCHES_TITLE;
  const emptyCopy = recommend ? EXPLORE_SEARCH_RECOMMENDED_EMPTY : EXPLORE_SEARCH_MATCHES_EMPTY;

  return (
    <section
      aria-labelledby="explore-search-compose-feed"
      className="space-y-3"
      data-explore-search-compose-feed={feedMode}
    >
      <div>
        <h2 id="explore-search-compose-feed" className="text-sm font-bold text-neutral-900">
          {sectionTitle}
        </h2>
        {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      </div>

      <ExploreSearchRecommendedScopePills active={searchScope} onChange={onScopeChange} />

      {searchScope === 'crew' && !crewFeed.signedIn ? (
        <ExploreGuestSignInCard intent="explore-people-browse" compact />
      ) : null}

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100" aria-hidden />
      ) : null}

      {searchScope !== 'crew' && cards.length > 0 ? (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id}>
              <BrowseCompactRow card={card} />
            </li>
          ))}
        </ul>
      ) : null}

      {searchScope === 'crew' && crewFeed.rows.length > 0 ? (
        <ul className="space-y-2">
          {crewFeed.rows.map((row) => {
            const { key, userId: _userId, ...memberProps } = row;
            return (
              <li key={key}>
                <CrewBrowseMemberRow {...memberProps} />
              </li>
            );
          })}
        </ul>
      ) : null}

      {searchScope === 'groups' && communityGroups.rows.length > 0 ? (
        <CommunityDiscoverBrowseList rows={communityGroups.rows} compact />
      ) : null}

      {searchScope === 'groups' && !FEATURE_FLAGS.communityDiscover ? (
        <p className="text-sm text-neutral-500">Community groups are not available in this build.</p>
      ) : null}

      {showCatalogEmpty || showCrewEmpty || showGroupsEmpty ? (
        <p className="text-sm text-neutral-500">{emptyCopy}</p>
      ) : null}
    </section>
  );
};