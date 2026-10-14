import type { ActivityDTO, ProfileViewerAccessDTO } from '@uaetrail/shared-types';
import type { PublicMemberProfileDTO } from '../api/types';
import { api } from '../api/index';

export type PersonPublicProfilePayload = {
  profile: PublicMemberProfileDTO;
  viewerAccess: ProfileViewerAccessDTO | null;
};

export const fetchMeProfilePublicPreview = async (): Promise<PersonPublicProfilePayload> => {
  const res = await api.getMeProfilePublicPreview();
  return { profile: res.data, viewerAccess: res.viewerAccess ?? null };
};

export const fetchPersonPublicProfile = async (
  userId: string,
  options?: { discover?: boolean }
): Promise<PersonPublicProfilePayload> => {
  const res = await api.getPersonPublicProfile(userId, options);
  return { profile: res.data, viewerAccess: res.viewerAccess ?? null };
};

export const fetchPersonUpcomingActivities = async (
  userId: string,
  limit = 8
): Promise<ActivityDTO[]> => {
  const res = await api.getPersonUpcomingActivities(userId, limit);
  return res.data;
};
