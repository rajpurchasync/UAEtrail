import { useQuery } from '@tanstack/react-query';
import { fetchMemberPeopleNetworkPreview } from '@/hooks/memberPeopleClientApi';
import { crewDiscoveryNetworkPreviewQueryKey } from '../lib/crewDiscoveryQueryKeys';

const PREVIEW_STALE_MS = 120_000;

/** Map pill preview counts for Find crew (friends on outings merged client-side). */
export const useCrewDiscoveryNetworkPreview = (enabled: boolean) => {
  const query = useQuery({
    queryKey: crewDiscoveryNetworkPreviewQueryKey(),
    enabled,
    staleTime: PREVIEW_STALE_MS,
    queryFn: async () => fetchMemberPeopleNetworkPreview(),
  });

  return {
    preview: query.data ?? null,
    refresh: () => query.refetch(),
  };
};