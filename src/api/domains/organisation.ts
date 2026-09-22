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
    getTenantProfile: (slug: string) => apiRequest<{ data: TenantPublicDTO }>(`/tenants/${slug}`),

    getHostRequests: (tenantId: string) =>
    apiRequest<{ data: ActivityRequestView[] }>('/host/requests?pageSize=100', {
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    decideHostRequest: (tenantId: string, requestId: string, status: 'approved' | 'rejected', hostNote?: string) =>
    apiRequest(`/host/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ status, organizerNote: hostNote })
    }),

    getHostTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/host/team', {
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    createHostTeamMember: (tenantId: string, payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }) =>
    apiRequest<{ data: TeamMember }>('/host/team', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload)
    }),

    updateHostTeamMemberRole: (tenantId: string, membershipId: string, role: 'tenant_admin' | 'tenant_guide') =>
    apiRequest<{ data: { id: string; role: string } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ role })
    }),

    toggleHostTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify({ isActive })
    }),

    removeHostTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/host/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    submitHostApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/host-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data)
    }),

    getMyHostApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/host-application', { auth: true }),

    getMyHostStatus: () =>
    apiRequest<{ data: import('@uaetrail/shared-types').HostStatusDTO }>('/me/host-status', { auth: true }),

    updateHostDetails: (data: HostDetails) =>
    apiRequest<{ data: HostDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    })
} as const;
