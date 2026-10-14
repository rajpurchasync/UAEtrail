import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMeMemberDiscoveryRoster } from '@/hooks/memberPeopleClientApi';
import {
  memberDiscoveryRosterQueryKey,
  type MemberDiscoveryRosterQueryParams,
} from '../lib/memberPeopleQueryKeys';
import {
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '@/explore/routing';

type UseMemberDiscoveryRosterArgs = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
  /** List Buddies omits public directory (panel discover keeps it). */
  omitDirectory?: boolean;
};

const ROSTER_STALE_MS = 60_000;

export const useMemberDiscoveryRoster = ({
  enabled,
  search,
  activityDatePreset,
  omitDirectory = false,
}: UseMemberDiscoveryRosterArgs) => {
  const deferredSearch = useDeferredValue(search.trim());

  const queryParams: MemberDiscoveryRosterQueryParams = {
    q: deferredSearch,
    datePreset: activityDatePreset,
    omitDirectory,
  };

  const query = useQuery({
    queryKey: memberDiscoveryRosterQueryKey(queryParams),
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
    seekingOnMap: query.data?.seekingOnMap ?? [],
    followed: query.data?.followed ?? [],
    directory: query.data?.directory ?? [],
    quota: query.data?.quota ?? null,
    loading: enabled && query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load discover roster.' : null,
    refresh: () => query.refetch(),
  };
};
