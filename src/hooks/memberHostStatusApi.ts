import type { HostStatusDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMemberHostStatus = async (): Promise<HostStatusDTO> => {
  const res = await api.getMemberHostStatus();
  return res.data;
};
