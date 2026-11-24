import { useMemo } from 'react';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { serializeExploreActivityDatePreset } from '../routing';
import { useAuth } from '../../context/AuthContext';
import { useCrewDiscoveryAvailability } from '@/crew-discovery/hooks/useCrewDiscoveryAvailability';
import { useCrewDiscoveryRoster } from '@/crew-discovery/hooks/useCrewDiscoveryRoster';
import { resolveRecommendedCrewFeedRows } from '@/crew-discovery/resolveRecommendedCrewFeedRows';
import { useDiscoverCrewRecommendations } from '@/hooks/useDiscoverCrewRecommendations';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import { exploreSearchWhereEffectiveQuery } from './exploreSearchWhereDisplay';
import { EXPLORE_SEARCH_HOME_UPCOMING_LIMIT } from './exploreSearchUpcomingTrips';

type UseExploreSearchRecommendedCrewInput = {
  enabled: boolean;
  draftQuery: string;
  detectedWhere: string;
  activityDatePreset: ExploreActivityDatePreset;
  venueRegions: string[];
  limit?: number;
};

/** Crew recommendations for search home / counts — member graph, not map catalog projection. */
export const useExploreSearchRecommendedCrew = ({
  enabled,
  draftQuery,
  detectedWhere,
  activityDatePreset,
  venueRegions,
  limit = EXPLORE_SEARCH_HOME_UPCOMING_LIMIT,
}: UseExploreSearchRecommendedCrewInput) => {
  const { user } = useAuth();
  const active = enabled && Boolean(user);

  const search = useMemo(
    () => exploreSearchWhereBrowseQuery(exploreSearchWhereEffectiveQuery(draftQuery, detectedWhere)),
    [detectedWhere, draftQuery]
  );

  /** Emirate / area hint — same UAE venue bands as trips & places; empty = UAE-wide. */
  const area = useMemo(() => venueRegions[0]?.trim() || null, [venueRegions]);

  const roster = useCrewDiscoveryRoster({
    enabled: active,
    search,
    activityDatePreset,
    omitDirectory: false,
  });

  const availability = useCrewDiscoveryAvailability({
    enabled: active,
    search,
    activityDatePreset,
    areaSlug: area,
    mapFilter: 'all',
  });

  const crewRecommendationsQuery = useMemo(
    () => ({
      from: availability.range.from,
      to: availability.range.to,
      date: serializeExploreActivityDatePreset(activityDatePreset),
      area,
      kind: null as const,
      limit: Math.max(limit, 12),
    }),
    [activityDatePreset, area, availability.range.from, availability.range.to, limit]
  );

  const serverRecommendations = useDiscoverCrewRecommendations(active, crewRecommendationsQuery);

  const allRows = useMemo(
    () =>
      resolveRecommendedCrewFeedRows(serverRecommendations.data, {
        friendsGoing: roster.friendsGoing,
        hostsGoing: roster.hostsGoing,
        availabilityPeople: availability.people,
        directory: roster.directory,
        discoveryQuota: roster.quota,
        caps: { friends: 12, available: 12, directory: 6 },
      }),
    [
      availability.people,
      roster.directory,
      roster.friendsGoing,
      roster.hostsGoing,
      roster.quota,
      serverRecommendations.data,
    ]
  );

  const rows = useMemo(() => allRows.slice(0, limit), [allRows, limit]);

  const loading =
    active &&
    (roster.loading || availability.loading || serverRecommendations.isLoading);

  return {
    rows,
    totalCount: allRows.length,
    loading,
    signedIn: Boolean(user),
  };
};