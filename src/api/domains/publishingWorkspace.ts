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
 * Tenant publishing workspace HTTP (`/publishing/*` + `x-tenant-id`).
 * UI should use `tenantActivityClientApi` / `operatorDeskClientApi` — not raw `api.*` (`apiClientSurfaceGuard`).
 */
export const publishingWorkspaceApi = {
  getPublishingActivityJoinRequests: (tenantId: string, options?: { activityId?: string }) => {
    const params = new URLSearchParams({ pageSize: '100' });
    if (options?.activityId) {
      params.set('activityId', options.activityId);
    }
    return apiRequest<{ data: ActivityRequestView[] }>(`/publishing/requests?${params.toString()}`, {
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
    apiRequest(`/publishing/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify({ status, hostNote }),
    }),

  getPublishingTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/publishing/team', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createPublishingTeamMember: (
    tenantId: string,
    payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
  ) =>
    apiRequest<{ data: TeamMember }>('/publishing/team', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updatePublishingTeamMemberRole: (
    tenantId: string,
    membershipId: string,
    role: 'tenant_admin' | 'tenant_guide'
  ) =>
    apiRequest<{ data: { id: string; role: string } }>(`/publishing/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify({ role }),
    }),

  togglePublishingTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(
      `/publishing/team/${membershipId}`,
      {
        method: 'PATCH',
        auth: true,
        headers: tenantScopeHeaders(tenantId),
        body: JSON.stringify({ isActive }),
      }
    ),

  removePublishingTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/publishing/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  submitPublishingPlace: (tenantId: string, payload: Partial<PlaceDTO>) =>
    apiRequest<{ data: PlaceDTO }>('/publishing/places', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  getPublishingSubmittedPlaces: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/publishing/places', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  listActivities: (tenantId: string) =>
    apiRequest<{ data: ActivityDTO[] }>('/publishing/activities?pageSize=100', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  listPublishingActivitiesPage: (
    tenantId: string,
    queryString: string
  ) =>
    apiRequest<{
      data: ActivityDTO[];
      meta?: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/publishing/activities?${queryString}`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createActivity: (tenantId: string, payload: PublishingActivityUpsertBody) =>
    apiRequest<{ data: ActivityDTO }>('/publishing/activities', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updateActivity: (tenantId: string, activityId: string, payload: PublishingActivityUpsertBody) =>
    apiRequest<{ data: ActivityDTO }>(`/publishing/activities/${activityId}`, {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  publishActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/publishing/activities/${activityId}/publish`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  suspendActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/publishing/activities/${activityId}/suspend`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  resumeActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/publishing/activities/${activityId}/resume`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  duplicateActivity: (tenantId: string, activityId: string) =>
    apiRequest<{ data: ActivityDTO }>(`/publishing/activities/${activityId}/duplicate`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  cancelActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/publishing/activities/${activityId}`, {
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
    }>(`/publishing/activities/${activityId}/participants`, {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  checkinParticipant: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/publishing/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  undoCheckin: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/publishing/activities/${activityId}/participants/${participantId}/checkin`, {
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
    apiRequest(`/publishing/activities/${activityId}/participants/${participantId}/revoke`, {
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
      `/publishing/activities/${activityId}/participants/${participantId}/rating`,
      {
        method: 'POST',
        auth: true,
        headers: tenantScopeHeaders(tenantId),
        body: JSON.stringify(payload),
      }
    ),

  getPublishingActivityGuides: (tenantId: string, activityId: string) =>
    apiRequest<{ data: ActivityGuideHostDTO[] }>(`/publishing/activities/${activityId}/guides`, {
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
    }>('/publishing/activities/history', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  getPublishingShopProfile: (tenantId: string) =>
    apiRequest<{ data: ShopOperatorProfileDTO }>('/publishing/shop-profile', {
      auth: true,
      headers: tenantScopeHeaders(tenantId),
    }),

  createPublishingShopProfile: (
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
    apiRequest<{ data: ShopOperatorProfileDTO }>('/publishing/shop-profile', {
      method: 'POST',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),

  updatePublishingShopProfile: (
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
    apiRequest<{ data: ShopOperatorProfileDTO }>('/publishing/shop-profile', {
      method: 'PATCH',
      auth: true,
      headers: tenantScopeHeaders(tenantId),
      body: JSON.stringify(payload),
    }),
} as const;
