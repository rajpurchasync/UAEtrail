import {
  ActivityDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  JoinRequestDTO,
  MyActivityDTO,
  ParticipantDTO,
  WithdrawReason,
} from '@uaetrail/shared-types';
import { apiRequest, getStoredSession } from '../client';
import { organisationRequestHeaders } from '../orgHeaders';
import type { ActivityDetail, ActivityRequestView } from '../types';

/**
 * Activity HTTP client — one entity (`activities`), different **routes** by surface:
 * - Browse catalog: `getPublicActivities` / `getFeaturedActivities` → `GET /activities`
 * - Member trips: `getMeActivities` → `GET /me/activities`
 * - Publishing console (tenant + `x-organisation-id`): `listActivities(tenantId)` → `GET /operator/activities`
 *
 * UI should call `tenantActivityClientApi` — not `api.listActivities` directly (`apiLegacyGuard`).
 */
export const activitiesApi = {
    getPublicActivities: (opts?: { when?: 'upcoming' | 'past' | 'all'; pageSize?: number }) => {
    const params = new URLSearchParams();
    params.set('pageSize', String(opts?.pageSize ?? 100));
    if (opts?.when) params.set('when', opts.when);
    return apiRequest<{ data: ActivityDTO[] }>(`/activities?${params.toString()}`);
  },

    getFeaturedActivities: (limit = 6) =>
    apiRequest<{ data: ActivityDTO[] }>(`/activities/featured?limit=${limit}`),

    getPublicActivityDetail: (id: string) =>
    apiRequest<{
      data: ActivityDetail;
      viewerAccess: ActivityViewerAccessDTO;
      presentation?: ActivityPresentationDTO;
    }>(`/activities/${id}`, {
      auth: Boolean(getStoredSession()),
    }),

    listActivityJoinInvitesSent: (activityId: string) =>
      apiRequest<{ data: import('@uaetrail/shared-types').ActivityJoinInvitesSentDTO }>(
        `/activities/${activityId}/invites`,
        { auth: true }
      ),

    sendActivityJoinInvite: (activityId: string, inviteeUserId: string) =>
      apiRequest<{ data: { id: string; status: 'pending' } }>(`/activities/${activityId}/invites`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ inviteeUserId }),
      }),

    sendActivityJoinInvites: (activityId: string, inviteeUserIds: string[]) =>
      apiRequest<{ data: { sent: number; inviteeUserIds: string[] } }>(
        `/activities/${activityId}/invites`,
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ inviteeUserIds }),
        }
      ),

    getActivityGroupChat: (activityId: string) =>
    apiRequest<{
      data: {
        groupId: string;
        membershipId: string | null;
        isMember: boolean;
        canLeave: boolean;
      };
    }>(`/activities/${activityId}/group-chat`, { auth: true }),

    getActivityGroupChatStatus: (activityId: string) =>
    apiRequest<{
      data: {
        groupId: string | null;
        membershipId: string | null;
        isMember: boolean;
        canLeave: boolean;
      };
    }>(`/activities/${activityId}/group-chat/status`, { auth: true }),

    joinActivityGroupChat: (activityId: string) =>
    apiRequest<{
      data: {
        groupId: string | null;
        membershipId: string | null;
        isMember: boolean;
        canLeave: boolean;
      };
    }>(`/activities/${activityId}/group-chat/join`, { method: 'POST', auth: true }),

    leaveActivityGroupChat: (activityId: string) =>
    apiRequest<{ data: { left: boolean } }>(`/activities/${activityId}/group-chat`, {
      method: 'DELETE',
      auth: true,
    }),

    createJoinRequest: (activityId: string, note?: string) =>
    apiRequest<{ data: JoinRequestDTO }>(`/activities/${activityId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(note !== undefined ? { note } : {}),
    }),

    rsvpActivity: (activityId: string) =>
    apiRequest<{ data: { request: JoinRequestDTO; participation: MyActivityDTO['participation'] } }>(
      `/activities/${activityId}/rsvp`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({}),
      }
    ),

    cancelJoinRequest: (
    activityId: string,
    requestId: string,
    payload: { reason: WithdrawReason; message?: string }
  ) =>
    apiRequest(`/activities/${activityId}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    updateJoinRequestNote: (activityId: string, requestId: string, note: string) =>
    apiRequest<{ data: { id: string; note: string } }>(`/activities/${activityId}/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ note }),
    }),

    getMeRequests: () => apiRequest<{ data: ActivityRequestView[] }>('/me/requests?pageSize=100', { auth: true }),

    getMeRequest: (requestId: string) =>
    apiRequest<{ data: ActivityRequestView }>(`/me/requests/${requestId}`, { auth: true }),

    getMeActivities: () =>
      apiRequest<{ data: MyActivityDTO[] }>('/me/activities?pageSize=100', { auth: true }),

    getAdminActivities: () => apiRequest<{ data: ActivityDTO[] }>('/admin/activities/moderation', { auth: true }),

    getAdminActivityDetail: (id: string) =>
    apiRequest<{ data: ActivityDTO }>(`/admin/activities/${id}`, { auth: true }),

    getAdminActivityEngagement: (id: string) =>
      apiRequest<{
        data: {
          participants: Array<{
            id: string;
            userId: string;
            checkedInAt: string | null;
            createdAt: string;
            displayName: string | null;
            email: string;
          }>;
          joinRequests: Array<{
            id: string;
            userId: string;
            status: string;
            note: string | null;
            createdAt: string;
            displayName: string | null;
            email: string;
          }>;
        };
      }>(`/admin/activities/${id}/engagement`, { auth: true }),

    moderateActivity: (id: string, action: 'suspend' | 'unsuspend', comment?: string) =>
    apiRequest(`/admin/activities/moderation/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ action, comment })
    }),

    toggleActivityFeatured: (id: string) =>
    apiRequest<{ message: string; featured: boolean }>(`/admin/activities/${id}/featured`, {
      method: 'PATCH',
      auth: true
    }),

    /** Tenant activity list (`GET /operator/activities`). */
    listActivities: (tenantId: string) =>
      apiRequest<{ data: ActivityDTO[] }>('/operator/activities?pageSize=100', {
        auth: true,
        headers: organisationRequestHeaders(tenantId),
      }),

    createActivity: (tenantId: string, payload: Record<string, unknown>) =>
      apiRequest<{ data: ActivityDTO }>('/operator/activities', {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
        body: JSON.stringify(payload),
      }),

    updateActivity: (tenantId: string, activityId: string, payload: Record<string, unknown>) =>
      apiRequest<{ data: ActivityDTO }>(`/operator/activities/${activityId}`, {
        method: 'PATCH',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
        body: JSON.stringify(payload),
      }),

    publishActivity: (tenantId: string, activityId: string) =>
      apiRequest(`/operator/activities/${activityId}/publish`, {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
      }),

    /** @deprecated Prefer `exploreApi.linkParticipantIntentToActivity` (poster-owned demand). */
    fulfillParticipantIntent: (tenantId: string, intentId: string, activityId: string) =>
    apiRequest<import('@uaetrail/shared-types').ParticipantIntentDTO>(
      `/operator/participant-intents/${intentId}/fulfill`,
      {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
        body: JSON.stringify({ activityId })
      }
    ),

    duplicateActivity: (tenantId: string, activityId: string) =>
      apiRequest<{ data: ActivityDTO }>(`/operator/activities/${activityId}/duplicate`, {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
      }),

    cancelActivity: (tenantId: string, activityId: string) =>
      apiRequest(`/operator/activities/${activityId}`, {
        method: 'DELETE',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
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
    }>(`/operator/activities/${activityId}/participants`, {
      auth: true,
      headers: organisationRequestHeaders(tenantId),
    }),

    checkinParticipant: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/operator/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    undoCheckin: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/operator/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    revokeActivityParticipant: (
      tenantId: string,
      activityId: string,
      participantId: string,
      organizerNote: string
    ) =>
      apiRequest(`/operator/activities/${activityId}/participants/${participantId}/revoke`, {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
        body: JSON.stringify({ organizerNote }),
      }),

    rateActivityParticipant: (
      tenantId: string,
      activityId: string,
      participantId: string,
      payload: { score: number; comment?: string }
    ) =>
      apiRequest<{ data: { score: number; comment: string | null; ratedAt: string | null } }>(
        `/operator/activities/${activityId}/participants/${participantId}/rating`,
        {
          method: 'POST',
          auth: true,
          headers: organisationRequestHeaders(tenantId),
          body: JSON.stringify(payload),
        }
      ),

    getActivityHistory: (tenantId: string) =>
    apiRequest<{ data: Array<{ id: string; title: string; locationName: string; activityType: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number }> }>(
      '/operator/activities/history',
      { auth: true, headers: organisationRequestHeaders(tenantId) }
    )
} as const;
