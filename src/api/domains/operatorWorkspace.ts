import {
  ActivityDTO,
  type ActivityGuideHostDTO,
  LocationDTO,
  ParticipantDTO,
  PlaceDTO,
  type PublishingActivityUpsertBody,
  type ShopOperatorProfileDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { tenantScopeHeaders } from '../tenantScopeHeaders';
import type { ActivityRequestView, TeamMember } from '../types';

/**
 * Operator workspace HTTP (`/workspace/*` + `x-tenant-id`).
 * UI should use `tenantActivityClientApi` / `operatorDeskClientApi` — not raw `api.*` (`apiClientSurfaceGuard`).
 */
export const operatorWorkspaceApi = {
  getWorkspaceActivityJoinRequests: (tenantId: string, options?: { activityId?: string }) => {
    const params = new URLSearchParams({ pageSize: '100' });
    if (options?.activityId) {
      params.set('activityId', options.activityId);
    }
    return apiRequest<{ data: ActivityRequestView[] }>(`/workspace/requests?${params.toString()}`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    });
  },

  decideActivityJoinRequest: (
    tenantId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    hostNote?: string
  ) =>
    apiRequest(`/workspace/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify({ status, hostNote }),
    }),

  getWorkspaceTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/workspace/team', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createWorkspaceTeamMember: (
    tenantId: string,
    payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
  ) =>
    apiRequest<{ data: TeamMember }>('/workspace/team', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updateWorkspaceTeamMemberRole: (
    tenantId: string,
    membershipId: string,
    role: 'tenant_admin' | 'tenant_guide'
  ) =>
    apiRequest<{ data: { id: string; role: string } }>(`/workspace/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify({ role }),
    }),

  toggleWorkspaceTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(
      `/workspace/team/${membershipId}`,
      {
        method: 'PATCH',
        auth: true,
        headers: tenantScopeHeaders(tenantId),
        body: JSON.stringify({ isActive }),
      }
    ),

  removeWorkspaceTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/workspace/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  submitWorkspacePlace: (tenantId: string, payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/workspace/places', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  getWorkspaceSubmittedPlaces: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/workspace/places', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  listActivities: (tenantId: string) =>
    apiRequest<{ data: ActivityDTO[] }>('/workspace/activities?pageSize=100', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  listWorkspaceActivitiesPage: (
    tenantId: string,
    queryString: string
  ) =>
    apiRequest<{
      data: ActivityDTO[];
      meta?: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/workspace/activities?${queryString}`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createActivity: (tenantId: string, payload: PublishingActivityUpsertBody) =>
    apiRequest<{ data: ActivityDTO }>('/workspace/activities', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updateActivity: (tenantId: string, activityId: string, payload: PublishingActivityUpsertBody) =>
    apiRequest<{ data: ActivityDTO }>(`/workspace/activities/${activityId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  publishActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/workspace/activities/${activityId}/publish`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  suspendActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/workspace/activities/${activityId}/suspend`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  resumeActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/workspace/activities/${activityId}/resume`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  duplicateActivity: (tenantId: string, activityId: string) =>
    apiRequest<{ data: ActivityDTO }>(`/workspace/activities/${activityId}/duplicate`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  cancelActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/workspace/activities/${activityId}`, {
      method: 'DELETE',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  getActivityParticipants: (tenantId: string, activityId: string) =>
    apiRequest<{
      data: {
        activityId: string;
        activityTitle: string;
        capacity: number;
        activityEnded: boolean;
        participants: ParticipantDTO[];
      };
    }>(`/workspace/activities/${activityId}/participants`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  checkinParticipant: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/workspace/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  undoCheckin: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/workspace/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'DELETE',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  revokeActivityParticipant: (
    tenantId: string,
    activityId: string,
    participantId: string,
    hostNote: string
  ) =>
    apiRequest(`/workspace/activities/${activityId}/participants/${participantId}/revoke`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify({ hostNote }),
    }),

  rateActivityParticipant: (
    tenantId: string,
    activityId: string,
    participantId: string,
    payload: {
      score?: number;
      comment?: string;
      rideshare?: {
        cleanliness: number;
        punctuality: number;
        behaviour: number;
        payment?: number | null;
      };
    }
  ) =>
    apiRequest<{ data: { score: number; comment: string | null; ratedAt: string | null } }>(
      `/workspace/activities/${activityId}/participants/${participantId}/rating`,
      {
        method: 'POST',
        auth: true,
        headers: tenantScopeHeaders(tenantId),
        body: JSON.stringify(payload),
      }
    ),

  getWorkspaceActivityGuides: (tenantId: string, activityId: string) =>
    apiRequest<{ data: ActivityGuideHostDTO[] }>(`/workspace/activities/${activityId}/guides`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  getActivityHistory: (tenantId: string) =>
    apiRequest<{
      data: Array<{
        id: string;
        title: string;
        locationName: string;
        activityType: string;
        startAt: string;
        status: string;
        capacity: number;
        participantCount: number;
        checkedInCount: number;
      }>;
    }>('/workspace/activities/history', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  getWorkspaceShopProfile: (tenantId: string) =>
    apiRequest<{ data: ShopOperatorProfileDTO }>('/workspace/shop-profile', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createWorkspaceShopProfile: (
    tenantId: string,
    payload: {
      shopName: string;
      description?: string;
      logo?: string;
      websiteUrl?: string | null;
      contactEmail?: string;
      contactPhone?: string;
      latitude?: number | null;
      longitude?: number | null;
      region?: string | null;
      allowInboundChat?: boolean;
      showContactPhone?: boolean;
    }
  ) =>
    apiRequest<{ data: ShopOperatorProfileDTO }>('/workspace/shop-profile', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updateWorkspaceShopProfile: (
    tenantId: string,
    payload: Partial<{
      shopName: string;
      description?: string;
      logo?: string;
      websiteUrl?: string | null;
      contactEmail?: string;
      contactPhone?: string;
      latitude?: number | null;
      longitude?: number | null;
      region?: string | null;
      allowInboundChat?: boolean;
      showContactPhone?: boolean;
    }>
  ) =>
    apiRequest<{ data: ShopOperatorProfileDTO }>('/workspace/shop-profile', {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
} as const;
