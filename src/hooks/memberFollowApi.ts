import type { MemberFollowStateDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMemberFollowState = async (
  targetUserId: string
): Promise<MemberFollowStateDTO> => {
  const res = await api.getMemberFollowState(targetUserId);
  return res.data;
};

export const setMemberFollow = async (
  targetUserId: string,
  follow: boolean
): Promise<MemberFollowStateDTO> => {
  const res = follow
    ? await api.followMember(targetUserId)
    : await api.unfollowMember(targetUserId);
  return res.data;
};
