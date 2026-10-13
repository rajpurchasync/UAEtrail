import type { MemberStatusDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMemberStatus = async (): Promise<MemberStatusDTO> => {
  const res = await api.getMemberStatus();
  return res.data;
};
