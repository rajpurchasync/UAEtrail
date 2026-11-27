import type {
  FriendRelationshipDTO,
  FriendRequestDTO,
  FriendSummaryDTO,
  MemberFollowStateDTO,
  MemberFollowSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Mutual friends graph and one-way member follow (`GET /me/friends`, …). */
export const friendsApi = {
  getMeFriends: () => apiRequest<{ data: FriendSummaryDTO[] }>('/me/friends', { auth: true }),

  getMeFriendRequests: (direction: 'incoming' | 'outgoing' | 'all' = 'all') =>
    apiRequest<{ data: FriendRequestDTO[] }>(`/me/friend-requests?direction=${direction}`, { auth: true }),

  getFriendRelationship: (userId: string) =>
    apiRequest<{ data: FriendRelationshipDTO }>(`/me/friend-relationship/${userId}`, { auth: true }),

  sendFriendRequest: (payload: { targetUserId: string; message?: string }) =>
    apiRequest<{ data: FriendRequestDTO }>('/me/friend-requests', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  acceptFriendRequest: (requestId: string) =>
    apiRequest<{ data: FriendRequestDTO }>(`/me/friend-requests/${requestId}/accept`, {
      method: 'POST',
      auth: true,
    }),

  declineFriendRequest: (requestId: string) =>
    apiRequest<{ data: FriendRequestDTO }>(`/me/friend-requests/${requestId}/decline`, {
      method: 'POST',
      auth: true,
    }),

  cancelFriendRequest: (requestId: string) =>
    apiRequest<{ data: FriendRequestDTO }>(`/me/friend-requests/${requestId}/cancel`, {
      method: 'POST',
      auth: true,
    }),

  unfriendMember: (userId: string) =>
    apiRequest<{ data: { unfriended: true } }>(`/me/friends/${userId}/unfriend`, {
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