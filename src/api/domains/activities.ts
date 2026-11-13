import {
  ActivityDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  JoinRequestDTO,
  MyActivityDTO,
  WithdrawReason,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { ADMIN_TABLE_PAGE_SIZE } from '../listAllPages';
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
      auth: false,
    }),

    getActivityLinkedRides: (activityId: string) =>
      apiRequest<{ data: ActivityDTO[]; meta: { total: number } }>(
        `/activities/${activityId}/linked-rides`,
        { auth: false }
      ),

    getPublicActivityMeState: (id: string) =>
    apiRequest<{
      data: ActivityDetail;
      viewerAccess: ActivityViewerAccessDTO;
      presentation?: ActivityPresentationDTO;
    }>(`/activities/${id}/me/state`, {
      auth: true,
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

    acceptActivityGuideInvite: (activityId: string) =>
      apiRequest<{ data: { status: 'accepted' | 'declined' } }>(
        `/activities/${activityId}/guides/accept`,
        { method: 'POST', auth: true }
      ),

    declineActivityGuideInvite: (activityId: string) =>
      apiRequest<{ data: { status: 'accepted' | 'declined' } }>(
        `/activities/${activityId}/guides/decline`,
        { method: 'POST', auth: true }
      ),

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

    createJoinRequest: (
      activityId: string,
      body?: { note?: string; packingCheckedIds?: string[]; packingSignature?: string; adults?: number; kids?: number }
    ) =>
    apiRequest<{ data: JoinRequestDTO }>(`/activities/${activityId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body ?? {}),
    }),

    rsvpActivity: (
      activityId: string,
      body?: { note?: string; packingCheckedIds?: string[]; packingSignature?: string; adults?: number; kids?: number }
    ) =>
    apiRequest<{
      data: {
        request: JoinRequestDTO;
        participation: MyActivityDTO['participation'] | null;
        waitlisted?: boolean;
      };
    }>(
      `/activities/${activityId}/rsvp`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body ?? {}),
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

    updateJoinRequestParty: (
      activityId: string,
      requestId: string,
      body: {
        note?: string;
        adults?: number;
        kids?: number;
        partyMemberIds?: string[];
      }
    ) =>
      apiRequest<{
        data: {
          id: string;
          note?: string | null;
          adults?: number;
          kids?: number;
          partyMembers?: import('@uaetrail/shared-types').ActivityPartyMemberDTO[];
          partyApprovalPending?: boolean;
        };
      }>(`/activities/${activityId}/requests/${requestId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(body),
      }),

    acceptActivityFamilyInvite: (activityId: string, token: string) =>
      apiRequest<{
        data: {
          activityId: string;
          requestId: string;
          partyMembers?: import('@uaetrail/shared-types').ActivityPartyMemberDTO[];
          partyApprovalPending?: boolean;
        };
      }>(`/activities/${activityId}/family-invites/accept`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ token }),
      }),

    declineActivityFamilyInvite: (activityId: string, token: string) =>
      apiRequest<{
        data: {
          activityId: string;
          requestId: string;
          partyMembers?: import('@uaetrail/shared-types').ActivityPartyMemberDTO[];
        };
      }>(`/activities/${activityId}/family-invites/decline`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ token }),
      }),

    getMeRequests: () => apiRequest<{ data: ActivityRequestView[] }>('/me/requests?pageSize=100', { auth: true }),

    getMeRequest: (requestId: string) =>
    apiRequest<{ data: ActivityRequestView }>(`/me/requests/${requestId}`, { auth: true }),

    getMeActivities: () =>
      apiRequest<{ data: MyActivityDTO[] }>('/me/activities?pageSize=100', { auth: true }),

    getAdminActivities: (page = 1, pageSize = ADMIN_TABLE_PAGE_SIZE) =>
      apiRequest<{ data: ActivityDTO[]; meta?: { total: number } }>(
        `/admin/activities/moderation?page=${page}&pageSize=${pageSize}`,
        { auth: true }
      ),

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

    adminSetRideshareParent: (rideshareActivityId: string, parentActivityId: string | null) =>
      apiRequest<{ message: string; data: ActivityDTO | null }>(
        `/admin/activities/${rideshareActivityId}/rideshare-parent`,
        {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify({ parentActivityId }),
        }
      ),

    adminSetLinkedRideshare: (parentActivityId: string, rideshareActivityId: string | null) =>
      apiRequest<{ message: string; data: ActivityDTO | null }>(
        `/admin/activities/${parentActivityId}/linked-rideshare`,
        {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify({ rideshareActivityId }),
        }
      ),

    adminSetRideshareDestinationPlace: (rideshareActivityId: string, placeId: string | null) =>
      apiRequest<{ message: string; data: ActivityDTO | null }>(
        `/admin/activities/${rideshareActivityId}/rideshare-place`,
        {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify({ placeId }),
        }
      ),
} as const;
