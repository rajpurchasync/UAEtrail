import type {
  ActivityDetailDTO,
  ActivityParticipationDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

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
