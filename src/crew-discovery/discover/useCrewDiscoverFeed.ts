import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  crewDiscoveryRosterQueryKey,
  type CrewDiscoveryRosterQueryParams,
} from '../lib/crewDiscoveryQueryKeys';
import {
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '@/discovery/discoveryPortExploreOptionalFilterWire';
import { fetchDiscoverCrewFeed } from './crewFeedClient';

const FEED_STALE_MS = 60_000;

type Args = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
  omitDirectory?: boolean;
};

/** Discover layer — `GET /discover/crew` (replaces roster HTTP for Find crew). */
export const useCrewDiscoverFeed = ({
  enabled,
  search,
  activityDatePreset,
  omitDirectory = false,
}: Args) => {
  const deferredSearch = useDeferredValue(search.trim());

  const queryParams: CrewDiscoveryRosterQueryParams = {
    q: deferredSearch,
    datePreset: activityDatePreset,
    omitDirectory,
  };

  const query = useQuery({
    queryKey: [...crewDiscoveryRosterQueryKey(queryParams), 'discover-crew-feed'] as const,
    enabled,
    staleTime: FEED_STALE_MS,
    queryFn: async () => {
      const date = serializeExploreActivityDatePreset(activityDatePreset);
      return fetchDiscoverCrewFeed({
        q: deferredSearch || undefined,
        date: date || undefined,
        omitDirectory,
      });
    },
  });

  return {
    friendsGoing: query.data?.friendsGoing ?? [],
    hostsGoing: query.data?.hostsGoing ?? [],
    availabilityOnMap: query.data?.availabilityOnMap ?? [],
    availabilityFixed: query.data?.availabilityFixed ?? [],
    followed: query.data?.followed ?? [],
    directory: query.data?.directory ?? [],
    quota: query.data?.quota ?? null,
    loading: enabled && query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'Could not load crew discover feed.'
          : null,
    refresh: () => query.refetch(),
  };
};