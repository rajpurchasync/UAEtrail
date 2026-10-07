import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/index';
import {
  memberDiscoveryRosterQueryKey,
  type MemberDiscoveryRosterQueryParams,
} from './memberDiscoveryQueryKeys';
import {
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from './routing';

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
      const response = await api.getMeMemberDiscoveryRoster({
        q: deferredSearch || undefined,
        date: date || undefined,
        omitDirectory,
      });
      return {
        friendsGoing: response.data.friendsGoing ?? [],
        hostsGoing: response.data.hostsGoing ?? [],
        lookingFor: response.data.lookingFor ?? [],
        followed: response.data.followed ?? [],
        directory: response.data.directory ?? [],
        quota: response.meta.quota,
      };
    },
  });

  return {
    friendsGoing: query.data?.friendsGoing ?? [],
    hostsGoing: query.data?.hostsGoing ?? [],
    lookingFor: query.data?.lookingFor ?? [],
    followed: query.data?.followed ?? [],
    directory: query.data?.directory ?? [],
    quota: query.data?.quota ?? null,
    loading: enabled && query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? 'Could not load discover roster.' : null,
    refresh: () => query.refetch(),
  };
};
