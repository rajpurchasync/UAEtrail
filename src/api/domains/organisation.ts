import type { TenantPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { organisationRequestHeaders } from '../orgHeaders';
import type {
  ActivityRequestView,
  HostApplication,
  HostDetails,
  TeamMember,
} from '../types';

export const organisationApi = {
  getOrganisationProfile: (slug: string) =>
    apiRequest<{ data: TenantPublicDTO }>(`/tenants/${slug}`),

  /** Activity join queue (`GET /publishing/requests`). */
  getOperatorActivityJoinRequests: (tenantId: string, options?: { activityId?: string }) => {
    const params = new URLSearchParams({ pageSize: '100' });
    if (options?.activityId) {
      params.set('activityId', options.activityId);
    }
    return apiRequest<{ data: ActivityRequestView[] }>(`/publishing/requests?${params.toString()}`, {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    });
  },

  decideActivityJoinRequest: (
    tenantId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    hostNote?: string
  ) =>
    apiRequest(`/publishing/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ status, hostNote }),
    }),

  getOrganisationTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/publishing/team', {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),

  createOrganisationTeamMember: (
    tenantId: string,
    payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
  ) =>
    apiRequest<{ data: TeamMember }>('/publishing/team', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updateOrganisationTeamMemberRole: (tenantId: string, membershipId: string, role: 'tenant_admin' | 'tenant_guide') =>
    apiRequest<{ data: { id: string; role: string } }>(`/publishing/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ role }),
    }),

  toggleOrganisationTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(`/publishing/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ isActive }),
    }),

  removeOrganisationTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/publishing/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),

  submitOrganisationApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/pro-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    }),

  getMyOrganisationApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/pro-application', { auth: true }),


  updateOrganisationDetails: (data: HostDetails) =>
    apiRequest<{ data: HostDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
} as const;
