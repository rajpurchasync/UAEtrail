import type {
  BuddyRelationshipDTO,
  BuddyRequestDTO,
  BuddySummaryDTO,
  MemberFollowStateDTO,
  MemberFollowSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** People graph — mutual friends (BWL buddies) and one-way member follow. */
export const buddiesApi = {
  getMeBuddies: () => apiRequest<{ data: BuddySummaryDTO[] }>('/me/buddies', { auth: true }),

  getMeBuddyRequests: (direction: 'incoming' | 'outgoing' | 'all' = 'all') =>
    apiRequest<{ data: BuddyRequestDTO[] }>(`/me/buddy-requests?direction=${direction}`, { auth: true }),

  getBuddyRelationship: (userId: string) =>
    apiRequest<{ data: BuddyRelationshipDTO }>(`/me/buddy-relationship/${userId}`, { auth: true }),

  sendBuddyRequest: (payload: { targetUserId: string; message?: string }) =>
    apiRequest<{ data: BuddyRequestDTO }>('/me/buddy-requests', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  acceptBuddyRequest: (requestId: string) =>
    apiRequest<{ data: BuddyRequestDTO }>(`/me/buddy-requests/${requestId}/accept`, {
      method: 'POST',
      auth: true,
    }),

  declineBuddyRequest: (requestId: string) =>
    apiRequest<{ data: BuddyRequestDTO }>(`/me/buddy-requests/${requestId}/decline`, {
      method: 'POST',
      auth: true,
    }),

  cancelBuddyRequest: (requestId: string) =>
    apiRequest<{ data: BuddyRequestDTO }>(`/me/buddy-requests/${requestId}/cancel`, {
      method: 'POST',
      auth: true,
    }),

  unfriendBuddy: (userId: string) =>
    apiRequest<{ data: { unfriended: true } }>(`/me/buddies/${userId}/unfriend`, {
      method: 'POST',
      auth: true,
    }),

  getMeFollowing: () =>
    apiRequest<{ data: MemberFollowSummaryDTO[] }>('/me/following', { auth: true }),

  getMemberFollowState: (userId: string) =>
    apiRequest<{ data: MemberFollowStateDTO }>(`/me/follow-state/${userId}`, { auth: true }),

  followMember: (userId: string) =>
    apiRequest<{ data: MemberFollowStateDTO }>(`/me/following/${userId}`, {
      method: 'POST',
      auth: true,
    }),

  unfollowMember: (userId: string) =>
    apiRequest<{ data: MemberFollowStateDTO }>(`/me/following/${userId}`, {
      method: 'DELETE',
      auth: true,
    }),
} as const;
