import type { ReviewDTO, TenantPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { HostApplication, HostDetails, TeamMember } from '../api/types';

export type { HostApplication, HostDetails, TeamMember };

export const fetchOrganisationTeam = async (tenantId: string): Promise<TeamMember[]> => {
  const res = await api.getOrganisationTeam(tenantId);
  return res.data;
};

export const createOrganisationTeamMember = async (
  tenantId: string,
  payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
): Promise<void> => {
  await api.createOrganisationTeamMember(tenantId, payload);
};

export const removeOrganisationTeamMember = async (
  tenantId: string,
  membershipId: string
): Promise<void> => {
  await api.removeOrganisationTeamMember(tenantId, membershipId);
};

export const fetchMyOrganisationApplication = async (): Promise<HostApplication | null> => {
  const res = await api.getMyOrganisationApplication();
  return res.data;
};

export const submitOrganisationApplication = async (
  data: Record<string, unknown>
): Promise<HostApplication> => {
  const res = await api.submitOrganisationApplication(data);
  return res.data;
};

export const fetchOrganisationProfileBySlug = async (slug: string): Promise<TenantPublicDTO> => {
  const res = await api.getOrganisationProfile(slug);
  return res.data;
};

export const fetchOrganisationReviews = async (organisationId: string): Promise<ReviewDTO[]> => {
  const res = await api.getOrganisationReviews(organisationId);
  return res.data;
};

export const updateOrganisationDetails = async (data: HostDetails): Promise<void> => {
  await api.updateOrganisationDetails(data);
};
