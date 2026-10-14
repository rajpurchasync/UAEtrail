import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { fetchExploreSeekingActivities } from '@/hooks/exploreSeekingClientApi';
import {
  selectSeekingActivitiesFromExploreCatalog,
  type ExploreSeekingCatalogFilters,
} from '@/activity-discovery/catalog/seeking';

const SEEKING_ACTIVITIES_STALE_MS = 60_000;

export const peopleDiscoverySeekingActivitiesQueryKey = () =>
  ['people-discovery', 'seeking-activities'] as const;

type Args = {
  enabled: boolean;
  /** Client-side filters (map chips, search) — date omitted for People Looking for. */
  filters: ExploreSeekingCatalogFilters;
  /** When the API is unavailable, filter this explore catalog slice instead. */
  exploreCatalogFallback: ExploreMapItemDTO[];
};

export const usePeopleDiscoverySeekingActivities = ({
  enabled,
  filters,
  exploreCatalogFallback,
}: Args) => {
  const query = useQuery({
    queryKey: peopleDiscoverySeekingActivitiesQueryKey(),
    enabled,
    staleTime: SEEKING_ACTIVITIES_STALE_MS,
    queryFn: async () => {
      return fetchExploreSeekingActivities();
    },
  });

  const catalogSource = query.data ?? exploreCatalogFallback;

  const seekingActivities = useMemo(
    () => selectSeekingActivitiesFromExploreCatalog(catalogSource, filters),
    [
      catalogSource,
      filters.mapFilter,
      filters.buddySubtype,
      filters.outingTopic,
      filters.query,
      filters.activityDatePreset,
    ]
  );

  return {
    seekingActivities,
    loading: enabled && query.isPending && !query.data,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load looking-for outings.' : null,
    refresh: () => void query.refetch(),
  };
};
