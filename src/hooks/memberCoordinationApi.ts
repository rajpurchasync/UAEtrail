import type { MemberCoordinationAttentionDTO } from '@uaetrail/shared-types';
import { memberApi } from '../api/domains/member';

export const fetchMeCoordinationAttention = async (): Promise<MemberCoordinationAttentionDTO> => {
  const res = await memberApi.getMeCoordinationAttention();
  return res.data;
};
