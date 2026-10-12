import { api, type TenantMembershipView } from '../api/index';

export const fetchMyTenantMemberships = async (): Promise<TenantMembershipView[]> => {
  const res = await api.getMyTenants();
  return res.data ?? [];
};
