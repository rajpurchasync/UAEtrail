import { ActivityDTO, JoinRequestDTO, MyActivityDTO, ParticipantDTO, WithdrawReason } from '@uaetrail/shared-types';
import { apiRequest, getStoredSession } from '../client';
import { organisationRequestHeaders } from '../orgHeaders';
import type { ActivityDetail, ActivityRequestView } from '../types';

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
    apiRequest<{ data: ActivityDetail }>(`/activities/${id}`, { auth: Boolean(getStoredSession()) }),

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

    createJoinRequest: (activityId: string, note?: string, selectedPackageIndex?: number) =>
    apiRequest<{ data: JoinRequestDTO }>(`/activities/${activityId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        ...(note !== undefined ? { note } : {}),
        ...(selectedPackageIndex !== undefined ? { selectedPackageIndex } : {})
      })
    }),

    rsvpActivity: (activityId: string, selectedPackageIndex?: number) =>
    apiRequest<{ data: { request: JoinRequestDTO; participation: MyActivityDTO['participation'] } }>(
      `/activities/${activityId}/rsvp`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          ...(selectedPackageIndex !== undefined ? { selectedPackageIndex } : {})
        })
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

    listOrganisationActivities: (tenantId: string) =>
    apiRequest<{ data: ActivityDTO[] }>('/host/activities?pageSize=100', {
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    createOrganisationActivity: (tenantId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: ActivityDTO }>('/host/activities', {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload)
    }),

    updateOrganisationActivity: (tenantId: string, activityId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: ActivityDTO }>(`/host/activities/${activityId}`, {
      method: 'PATCH',
      auth: true,
      headers: organisationRequestHeaders(tenantId),
      body: JSON.stringify(payload)
    }),

    publishOrganisationActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/host/activities/${activityId}/publish`, {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    fulfillParticipantIntent: (tenantId: string, intentId: string, activityId: string) =>
    apiRequest<import('@uaetrail/shared-types').ParticipantIntentDTO>(
      `/host/participant-intents/${intentId}/fulfill`,
      {
        method: 'POST',
        auth: true,
        headers: organisationRequestHeaders(tenantId),
        body: JSON.stringify({ activityId })
      }
    ),

    duplicateOrganisationActivity: (tenantId: string, activityId: string) =>
    apiRequest<{ data: ActivityDTO }>(`/host/activities/${activityId}/duplicate`, {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    cancelOrganisationActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/host/activities/${activityId}`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    getActivityParticipants: (tenantId: string, activityId: string) =>
    apiRequest<{ data: { activityId: string; activityTitle: string; capacity: number; participants: ParticipantDTO[] } }>(
      `/host/activities/${activityId}/participants`,
      { auth: true, headers: organisationRequestHeaders(tenantId) }
    ),

    checkinParticipant: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/host/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    undoCheckin: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/host/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'DELETE',
      auth: true,
      headers: organisationRequestHeaders(tenantId)
    }),

    getActivityHistory: (tenantId: string) =>
    apiRequest<{ data: Array<{ id: string; title: string; locationName: string; activityType: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number }> }>(
      '/host/activities/history',
      { auth: true, headers: organisationRequestHeaders(tenantId) }
    )
} as const;
