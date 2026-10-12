import type { EntityFollowCheckDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type EntityFollowTarget = {
  tenantId?: string;
  locationId?: string;
  merchantId?: string;
};

export const fetchEntityFollowState = async (
  target: EntityFollowTarget
): Promise<EntityFollowCheckDTO> => {
  const res = await api.checkEntityFollow(target);
  return res.data;
};

export const followEntityTarget = async (
  target: EntityFollowTarget
): Promise<string> => {
  const res = await api.followEntity(target);
  return res.data.id;
};

export const unfollowEntityById = async (followId: string): Promise<void> => {
  await api.unfollowEntity(followId);
};
