import type { EntityFollowCheckDTO, EntityFollowDTO } from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { entityFollowsQueryKey } from './clientQueryKeys';

export type EntityFollowTarget = {
  tenantId?: string;
  locationId?: string;
  shopId?: string;
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

export const fetchMeEntityFollows = async (): Promise<EntityFollowDTO[]> => {
  const res = await api.getMeEntityFollows();
  return res.data ?? [];
};

export const invalidateEntityFollowsQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: entityFollowsQueryKey });
};
