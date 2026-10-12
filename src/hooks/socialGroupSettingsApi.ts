import type { GroupWallPostPolicy, SocialGroupView } from '../api/types';
import { api } from '../api/index';

export type { GroupWallPostPolicy, SocialGroupView };

export const updateMyGroupSettings = async (
  groupId: string,
  payload: {
    wallPostPolicy?: GroupWallPostPolicy;
    photoUrl?: string | null;
  }
): Promise<SocialGroupView> => {
  const res = await api.updateMeGroupSettings(groupId, payload);
  return res.data;
};
