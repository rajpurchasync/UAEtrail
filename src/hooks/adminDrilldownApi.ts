import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { AdminCommunityDetail, AdminSocialGroupDetail, TenantDetail } from '../api/types';

export type { AdminCommunityDetail, AdminSocialGroupDetail, TenantDetail };

export const fetchAdminCommunityDetail = async (id: string): Promise<AdminCommunityDetail> => {
  const res = await api.getAdminCommunityDetail(id);
  return res.data;
};

export const fetchAdminTenantDetail = async (id: string): Promise<TenantDetail> => {
  const res = await api.getAdminTenantDetail(id);
  return res.data;
};

export const fetchAdminGroupDetail = async (id: string): Promise<AdminSocialGroupDetail> => {
  const res = await api.getAdminGroupDetail(id);
  return res.data;
};

export const fetchAdminActivityDetail = async (id: string): Promise<ActivityDTO> => {
  const res = await api.getAdminActivityDetail(id);
  return res.data;
};
