import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useAuth } from '@/context/AuthContext';
import { fetchExploreSeekingActivities } from '@/hooks/exploreSeekingClientApi';
import { catalogFreshQueryOptions, loadCachedCatalog } from '@/lib/catalogSnapshot';
import {
  selectSeekingActivitiesFromExploreCatalog,
  type ExploreSeekingCatalogFilters,
} from '@/activity-discovery/catalog/seeking';

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
  const { user } = useAuth();
  const queryKey = user?.id
    ? [...peopleDiscoverySeekingActivitiesQueryKey(), user.id]
    : peopleDiscoverySeekingActivitiesQueryKey();
  const query = useQuery({
    queryKey,
    enabled,
    queryFn: () => loadCachedCatalog(queryKey, (etag) => fetchExploreSeekingActivities(etag)),
    ...catalogFreshQueryOptions<ExploreMapItemDTO[]>(queryKey),
  });

  const catalogSource = query.data ?? exploreCatalogFallback;

  const seekingActivities = useMemo(
    () => selectSeekingActivitiesFromExploreCatalog(catalogSource, filters),
    [catalogSource, filters]
  );

  return {
    seekingActivities,
    loading: enabled && query.isPending && !query.data,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load looking-for outings.' : null,
    refresh: () => void query.refetch(),
  };
};
