import type {
  ActivityDTO,
  MemberProfileSocialGraphDTO,
  ProfileViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { PublicMemberProfileDTO } from '../api/types';
import { api } from '../api/index';

export type MemberProfileProfileInclude = 'socialGraph' | 'upcoming' | 'past';

export type PersonPublicProfilePayload = {
  profile: PublicMemberProfileDTO;
  viewerAccess: ProfileViewerAccessDTO | null;
  socialGraph?: MemberProfileSocialGraphDTO | null;
  upcomingActivities?: ActivityDTO[] | null;
  pastActivities?: ActivityDTO[] | null;
};

export type MemberProfileSocialGraphPart = 'friends' | 'commonFollows';

export const fetchMeProfilePublicPreview = async (): Promise<PersonPublicProfilePayload> => {
  const res = await api.getMeProfilePublicPreview();
  return { profile: res.data, viewerAccess: res.viewerAccess ?? null };
};

export const fetchPersonPublicProfile = async (
  userId: string,
  options?: {
    discover?: boolean;
    socialGraph?: boolean;
    include?: MemberProfileProfileInclude[];
    upcomingLimit?: number;
    pastLimit?: number;
  }
): Promise<PersonPublicProfilePayload> => {
  const res = await api.getPersonPublicProfile(userId, options);
  return {
    profile: res.data,
    viewerAccess: res.viewerAccess ?? null,
    socialGraph: res.socialGraph ?? null,
    upcomingActivities: res.upcomingActivities ?? null,
    pastActivities: res.pastActivities ?? null,
  };
};

export const fetchPersonUpcomingActivities = async (
  userId: string,
  limit = 8
): Promise<ActivityDTO[]> => {
  const res = await api.getPersonUpcomingActivities(userId, limit);
  return res.data;
};

export const fetchPersonPastActivities = async (userId: string, limit = 8): Promise<ActivityDTO[]> => {
  const res = await api.getPersonPastActivities(userId, limit);
  return res.data;
};

export const fetchMemberProfileSocialGraph = async (
  userId: string,
  options?: { parts?: MemberProfileSocialGraphPart[] }
): Promise<MemberProfileSocialGraphDTO> => {
  const res = await api.getMemberProfileSocialGraph(userId, options);
  return res.data;
};
