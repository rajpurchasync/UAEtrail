import { useQuery } from '@tanstack/react-query';
import type { MemberCoordinationAttentionDTO } from '@uaetrail/shared-types';
import { fetchMeCoordinationAttention } from './memberCoordinationApi';
import { coordinationAttentionQueryKey } from './clientQueryKeys';

export const useMemberCoordinationAttention = (
  enabled: boolean,
  refreshKey = 0
): MemberCoordinationAttentionDTO & { loading: boolean } => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...coordinationAttentionQueryKey, refreshKey],
    queryFn: () => fetchMeCoordinationAttention(),
    enabled,
  });

  return {
    items: data?.items ?? [],
    loading: enabled && (isLoading || isFetching),
  };
};
