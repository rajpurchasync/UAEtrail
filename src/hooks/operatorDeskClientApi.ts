import type {
  OrganisationHostDetailsDTO,
  PlaceDTO,
  ReviewDTO,
  TenantPublicDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { HostApplication, TeamMember } from '../api/types';

export type { HostApplication, OrganisationHostDetailsDTO, TeamMember };

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

export const updateOrganisationTeamMemberRole = async (
  tenantId: string,
  membershipId: string,
  role: 'tenant_admin' | 'tenant_guide'
): Promise<void> => {
  await api.updateOrganisationTeamMemberRole(tenantId, membershipId, role);
};

export const toggleOrganisationTeamMemberStatus = async (
  tenantId: string,
  membershipId: string,
  active: boolean
): Promise<void> => {
  await api.toggleOrganisationTeamMemberStatus(tenantId, membershipId, active);
};

export const fetchOrganisationSubmittedPlaces = async (tenantId: string): Promise<PlaceDTO[]> => {
  const res = await api.getOrganisationSubmittedPlaces(tenantId);
  return res.data;
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

export const updateOrganisationDetails = async (data: OrganisationHostDetailsDTO): Promise<void> => {
  await api.updateOrganisationDetails(data);
};
