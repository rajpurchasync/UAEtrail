import { useQuery } from '@tanstack/react-query';
import type {
  ActivityDetailDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
  ActivityParticipationDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import { activityDetailQueryKey } from './clientQueryKeys';

export type PublicActivityDetailPayload = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  presentation: ActivityPresentationDTO | null;
  participation: ActivityParticipationDTO | null;
  myRequest: MyActivityRequestDTO | null;
};

export const fetchPublicActivityDetail = async (
  activityId: string
): Promise<PublicActivityDetailPayload> => {
  const res = await api.getPublicActivityDetail(activityId);
  return {
    activity: res.data,
    viewerAccess: res.viewerAccess ?? null,
    presentation: res.presentation ?? null,
    participation: res.data.myParticipation ?? null,
    myRequest: res.data.myRequest ?? null,
  };
};

export const usePublicActivityDetail = (activityId: string | undefined) => {
  const query = useQuery({
    queryKey: activityId ? activityDetailQueryKey(activityId) : ['activity', ''],
    queryFn: () => fetchPublicActivityDetail(activityId!),
    enabled: Boolean(activityId),
  });

  return {
    activity: query.data?.activity ?? null,
    viewerAccess: query.data?.viewerAccess ?? null,
    wirePresentation: query.data?.presentation ?? null,
    participation: query.data?.participation ?? null,
    myRequest: query.data?.myRequest ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
