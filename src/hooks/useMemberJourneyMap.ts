import { useQuery } from '@tanstack/react-query';
import type {
  JourneyMapEntryDTO,
  MemberJourneyMapStatsDTO,
  MemberMapPinDTO,
} from '@uaetrail/shared-types';
import { fetchMemberJourneyMap } from './memberJourneyMapApi';
import { memberJourneyMapQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

const emptyStats = (): MemberJourneyMapStatsDTO => ({
  totalPins: 0,
  wishlistCount: 0,
  visitedCount: 0,
  activityCheckInCount: 0,
  byActivityType: {},
});

export type MemberJourneyMapData = {
  pins: MemberMapPinDTO[];
  entries: JourneyMapEntryDTO[];
  stats: MemberJourneyMapStatsDTO;
};

export const useMemberJourneyMap = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: user ? memberJourneyMapQueryKey(user.id) : ['me', 'journey-map', ''],
    queryFn: async (): Promise<MemberJourneyMapData> => {
      const data = await fetchMemberJourneyMap();
      return {
        pins: data.pins,
        entries: data.entries ?? [],
        stats: data.stats,
      };
    },
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  return {
    pins: query.data?.pins ?? [],
    entries: query.data?.entries ?? [],
    stats: query.data?.stats ?? emptyStats(),
    loading: query.isLoading,
    error: query.isError ? 'Could not load your map. Try again.' : null,
    reload: query.refetch,
  };
};
