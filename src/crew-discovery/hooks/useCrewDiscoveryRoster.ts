import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMeMemberDiscoveryRoster } from '@/hooks/memberPeopleClientApi';
import {
  crewDiscoveryRosterQueryKey,
  type CrewDiscoveryRosterQueryParams,
} from '../lib/crewDiscoveryQueryKeys';
import {
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '@/explore/routing';

type Args = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
  /** List crews hub omits public directory; Find crew panel keeps Everyone. */
  omitDirectory?: boolean;
};

const ROSTER_STALE_MS = 60_000;

/** Find crew · **Friends** / **Everyone** roster. */
export const useCrewDiscoveryRoster = ({
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
    queryKey: crewDiscoveryRosterQueryKey(queryParams),
    enabled,
    staleTime: ROSTER_STALE_MS,
    queryFn: async () => {
      const date = serializeExploreActivityDatePreset(activityDatePreset);
      return fetchMeMemberDiscoveryRoster({
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
    followed: query.data?.followed ?? [],
    directory: query.data?.directory ?? [],
    quota: query.data?.quota ?? null,
    loading: enabled && query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load discover roster.' : null,
    refresh: () => query.refetch(),
  };
};