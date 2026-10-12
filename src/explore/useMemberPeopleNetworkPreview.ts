import { useQuery } from '@tanstack/react-query';
import { fetchMemberPeopleNetworkPreview } from '../hooks/memberPeopleClientApi';
import { memberPeopleNetworkPreviewQueryKey } from './memberPeopleQueryKeys';

const MEMBER_PEOPLE_PREVIEW_STALE_MS = 120_000;

/** Network counts + avatars for explore map people pill (map-going merged client-side). */
export const useMemberPeopleNetworkPreview = (enabled: boolean) => {
  const query = useQuery({
    queryKey: memberPeopleNetworkPreviewQueryKey(),
    enabled,
    staleTime: MEMBER_PEOPLE_PREVIEW_STALE_MS,
    queryFn: async () => {
      return fetchMemberPeopleNetworkPreview();
    },
  });

  return {
    preview: query.data ?? null,
    refresh: () => query.refetch(),
  };
};
