import type {
  OperatorHostDetailsDTO,
  PlaceDTO,
  ReviewDTO,
  TenantPublicDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { HostApplication, TeamMember } from '../api/types';

export type { HostApplication, OperatorHostDetailsDTO, TeamMember };

export const fetchPublishingTeam = async (tenantId: string): Promise<TeamMember[]> => {
  const res = await api.getPublishingTeam(tenantId);
  return res.data;
};

export const createPublishingTeamMember = async (
  tenantId: string,
  payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
): Promise<void> => {
  await api.createPublishingTeamMember(tenantId, payload);
};

export const removePublishingTeamMember = async (
  tenantId: string,
  membershipId: string
): Promise<void> => {
  await api.removePublishingTeamMember(tenantId, membershipId);
};

export const updatePublishingTeamMemberRole = async (
  tenantId: string,
  membershipId: string,
  role: 'tenant_admin' | 'tenant_guide'
): Promise<void> => {
  await api.updatePublishingTeamMemberRole(tenantId, membershipId, role);
};

export const togglePublishingTeamMemberStatus = async (
  tenantId: string,
  membershipId: string,
  active: boolean
): Promise<void> => {
  await api.togglePublishingTeamMemberStatus(tenantId, membershipId, active);
};

export const fetchPublishingSubmittedPlaces = async (tenantId: string): Promise<PlaceDTO[]> => {
  const res = await api.getPublishingSubmittedPlaces(tenantId);
  return res.data;
};

export const fetchMyOperatorProApplication = async (): Promise<HostApplication | null> => {
  const res = await api.getMyOperatorProApplication();
  return res.data;
};

export const submitOperatorProApplication = async (
  data: Record<string, unknown>
): Promise<HostApplication> => {
  const res = await api.submitOperatorProApplication(data);
  return res.data;
};

export const fetchOperatorPublicProfileBySlug = async (slug: string): Promise<TenantPublicDTO> => {
  const res = await api.getOperatorPublicProfile(slug);
  return res.data;
};

export const fetchTenantStorefrontReviews = async (tenantId: string): Promise<ReviewDTO[]> => {
  const res = await api.getTenantStorefrontReviews(tenantId);
  return res.data;
};

export const updateOperatorHostDetails = async (data: OperatorHostDetailsDTO): Promise<void> => {
  await api.updateOperatorHostDetails(data);
};
