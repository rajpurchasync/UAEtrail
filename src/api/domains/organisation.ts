import type { TenantPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { organisationRequestHeaders } from '../orgHeaders';
import type {
  ActivityRequestView,
  HostApplication,
  HostDetails,
  TeamMember,
} from '../types';

const fetchOrganisationProfile = (slug: string) =>
  apiRequest<{ data: TenantPublicDTO }>(`/tenants/${slug}`);

export const organisationApi = {
  getOrganisationProfile: fetchOrganisationProfile,
  /** @deprecated Use {@link organisationApi.getOrganisationProfile} */
  getTenantProfile: fetchOrganisationProfile,

  getOrganisationJoinRequests: (tenantId: string) =>
    apiRequest<{ data: ActivityRequestView[] }>('/host/requests?pageSize=100', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
  /** @deprecated Use {@link organisationApi.getOrganisationJoinRequests} */
  getHostRequests: (tenantId: string) =>
    apiRequest<{ data: ActivityRequestView[] }>('/host/requests?pageSize=100', {
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

  decideOrganisationJoinRequest: (
    tenantId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    hostNote?: string
  ) =>
    apiRequest(`/host/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ status, organizerNote: hostNote }),
    }),
  /** @deprecated Use {@link organisationApi.decideOrganisationJoinRequest} */
  decideHostRequest: (tenantId: string, requestId: string, status: 'approved' | 'rejected', hostNote?: string) =>
    apiRequest(`/host/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ status, organizerNote: hostNote }),
    }),

  getOrganisationTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/host/team', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
  /** @deprecated Use {@link organisationApi.getOrganisationTeam} */
  getHostTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/host/team', {
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

  createOrganisationTeamMember: (
    tenantId: string,
    payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
  ) =>
    apiRequest<{ data: TeamMember }>('/host/team', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
  /** @deprecated Use {@link organisationApi.createOrganisationTeamMember} */
  createHostTeamMember: (tenantId: string, payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }) =>
    apiRequest<{ data: TeamMember }>('/host/team', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload)
    }),

  updateOrganisationTeamMemberRole: (tenantId: string, membershipId: string, role: 'tenant_admin' | 'tenant_guide') =>
    apiRequest<{ data: { id: string; role: string } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ role }),
    }),
  /** @deprecated Use {@link organisationApi.updateOrganisationTeamMemberRole} */
  updateHostTeamMemberRole: (tenantId: string, membershipId: string, role: 'tenant_admin' | 'tenant_guide') =>
    apiRequest<{ data: { id: string; role: string } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ role })
    }),

  toggleOrganisationTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ isActive }),
    }),
  /** @deprecated Use {@link organisationApi.toggleOrganisationTeamMemberStatus} */
  toggleHostTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ isActive })
    }),

  removeOrganisationTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/host/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),
  /** @deprecated Use {@link organisationApi.removeOrganisationTeamMember} */
  removeHostTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/host/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

  submitOrganisationApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/host-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    }),
  /** @deprecated Use {@link organisationApi.submitOrganisationApplication} */
  submitHostApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/host-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data)
    }),

  getMyOrganisationApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/host-application', { auth: true }),
  /** @deprecated Use {@link organisationApi.getMyOrganisationApplication} */
  getMyHostApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/host-application', { auth: true }),

  getMyOrganisationStatus: () =>
    apiRequest<{ data: import('@uaetrail/shared-types').HostStatusDTO }>('/me/host-status', { auth: true }),
  /** @deprecated Use {@link organisationApi.getMyOrganisationStatus} */
  getMyHostStatus: () =>
    apiRequest<{ data: import('@uaetrail/shared-types').HostStatusDTO }>('/me/host-status', { auth: true }),

  updateOrganisationDetails: (data: HostDetails) =>
    apiRequest<{ data: HostDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
  /** @deprecated Use {@link organisationApi.updateOrganisationDetails} */
  updateHostDetails: (data: HostDetails) =>
    apiRequest<{ data: HostDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    })
} as const;
