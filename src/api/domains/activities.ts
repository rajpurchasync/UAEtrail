import {
  ActivityDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  JoinRequestDTO,
  MyActivityDTO,
  WithdrawReason,
} from '@uaetrail/shared-types';
import { apiRequest, getStoredSession } from '../client';
import type { ActivityDetail, ActivityRequestView } from '../types';

/**
 * Activity HTTP client — public catalog, member participation, admin moderation.
 * Tenant workspace CRUD: `publishingWorkspaceApi` + `tenantActivityClientApi`.
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
} as const;
