import { useQuery } from '@tanstack/react-query';
import { fetchPublicFacilityDetail } from './facilityDetailClientApi';
import { publicFacilityDetailQueryKey } from './clientQueryKeys';

export const usePublicFacilityDetail = (facilityId: string | undefined) => {
  const query = useQuery({
    queryKey: facilityId ? publicFacilityDetailQueryKey(facilityId) : ['facility-detail', ''],
    queryFn: () => fetchPublicFacilityDetail(facilityId!),
    enabled: Boolean(facilityId),
    staleTime: 60_000,
  });

  return {
    facility: query.data?.data ?? null,
    viewerAccess: query.data?.viewerAccess,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
