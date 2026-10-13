import type { MemberCoordinationAttentionDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMeCoordinationAttention = async (): Promise<MemberCoordinationAttentionDTO> => {
  const res = await api.getMeCoordinationAttention();
  return res.data;
};
