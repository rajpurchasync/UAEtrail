import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useAuth } from '@/context/AuthContext';
import { fetchExploreAvailabilityCatalog } from '@/hooks/exploreAvailabilityCatalogClientApi';
import { catalogFreshQueryOptions, loadCachedCatalog } from '@/lib/catalogSnapshot';
import {
  selectAvailabilityFromMapItems,
  type MapAvailabilityFilters,
} from '@/activity-discovery/catalog/availabilityCatalog';

export const peopleDiscoveryAvailabilityCatalogQueryKey = () =>
  ['people-discovery', 'availability-catalog'] as const;

type Args = {
  enabled: boolean;
  /** Client-side filters (map chips, search) — date omitted for People Looking for. */
  filters: MapAvailabilityFilters;
  /** When the API is unavailable, filter this explore catalog slice instead. */
  exploreCatalogFallback: ExploreMapItemDTO[];
};

export const usePeopleDiscoveryAvailabilityCatalog = ({
  enabled,
  filters,
  exploreCatalogFallback,
}: Args) => {
  const { user } = useAuth();
  const queryKey = user?.id
    ? [...peopleDiscoveryAvailabilityCatalogQueryKey(), user.id]
    : peopleDiscoveryAvailabilityCatalogQueryKey();
  const query = useQuery({
    queryKey,
    enabled,
    queryFn: () => loadCachedCatalog(queryKey, (etag) => fetchExploreAvailabilityCatalog(etag)),
    ...catalogFreshQueryOptions<ExploreMapItemDTO[]>(queryKey),
  });

  const catalogSource = query.data ?? exploreCatalogFallback;

  const availabilityCatalogItems = useMemo(
    () => selectAvailabilityFromMapItems(catalogSource, filters),
    [catalogSource, filters]
  );

  return {
    availabilityCatalogItems,
    loading: enabled && query.isPending && !query.data,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load looking-for outings.' : null,
    refresh: () => void query.refetch(),
  };
};
