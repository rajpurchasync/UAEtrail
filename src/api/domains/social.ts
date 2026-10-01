import {
  BuddyRelationshipDTO,
  BuddyRequestDTO,
  BuddySummaryDTO,
  MemberFollowStateDTO,
  MemberFollowSummaryDTO,
  MemberHubStatsDTO,
  FavoriteDTO,
  PostDTO,
  PostReplyDTO,
  ReviewDTO,
  MyReviewDTO,
} from '@uaetrail/shared-types';
import { apiRequest, getStoredSession } from '../client';
import type {
  ContentReportReason,
  ContentReportTargetType,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
  SocialGroupWallMessageView,
  SocialGroupWallReactionView,
} from '../types';

export const socialApi = {
    reportContent: (payload: {
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    details?: string;
  }) =>
    apiRequest<{ message: string }>('/reports', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

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

    getMeMemberHubStats: () =>
      apiRequest<{ data: MemberHubStatsDTO }>('/me/member-hub-stats', { auth: true }),

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

    getMeGroups: () => apiRequest<{ data: SocialGroupView[] }>('/me/groups', { auth: true }),

    createMeGroup: (payload: {
    type: 'family' | 'friends';
    name: string;
    slogan?: string;
    bannerUrl?: string;
    photoUrl?: string;
  }) =>
    apiRequest<{ data: SocialGroupView }>('/me/groups', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    deleteMeGroup: (groupId: string) =>
    apiRequest<{ message: string; data: { deleted: boolean } }>(`/me/groups/${groupId}`, {
      method: 'DELETE',
      auth: true
    }),

    getMeGroupDetail: (groupId: string) =>
    apiRequest<{
      data: {
        group: SocialGroupView;
        membership: SocialGroupMemberView;
        members: SocialGroupMemberView[];
        invites: SocialGroupInviteView[];
      };
    }>(`/me/groups/${groupId}`, { auth: true }),

    updateMeGroupSettings: (groupId: string, payload: { wallPostPolicy: 'all_members' | 'admins_only' }) =>
    apiRequest<{ data: SocialGroupView }>(`/me/groups/${groupId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

    createMeGroupInvite: (groupId: string, payload: { email: string; role: 'admin' | 'buddy' }) =>
    apiRequest<{ data: SocialGroupInviteView; inviteLink: string }>(`/me/groups/${groupId}/invites`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    acceptMeGroupInvite: (token: string) =>
    apiRequest<{ message: string }>(`/me/group-invites/accept`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ token })
    }),

    createMeGroupKid: (groupId: string, payload: { displayName: string; role?: 'admin' | 'buddy' }) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/kids`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    updateMeGroupMemberStatus: (groupId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive })
    }),

    updateMeGroupMemberRole: (groupId: string, membershipId: string, role: 'buddy' | 'admin') =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ role })
    }),

    removeMeGroupMember: (groupId: string, membershipId: string) =>
    apiRequest<{ data: { removed: boolean } }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'DELETE',
      auth: true
    }),

    getMeGroupWall: (groupId: string, options?: { since?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (options?.since) params.set('since', options.since);
      if (options?.limit) params.set('limit', String(options.limit));
      const qs = params.toString();
      return apiRequest<{ data: SocialGroupWallMessageView[] }>(
        `/me/groups/${groupId}/wall${qs ? `?${qs}` : ''}`,
        { auth: true }
      );
    },

    markMeGroupWallRead: (groupId: string) =>
    apiRequest<{ data: { read: boolean } }>(`/me/groups/${groupId}/wall/read`, {
      method: 'POST',
      auth: true,
    }),

    createMeGroupWallPost: (groupId: string, body: string) =>
    apiRequest<{ data: SocialGroupWallMessageView }>(`/me/groups/${groupId}/wall`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ body })
    }),

    toggleMeGroupWallReaction: (
    groupId: string,
    messageId: string,
    kind: SocialGroupWallReactionView['kind']
  ) =>
    apiRequest<{ data: { reactions: SocialGroupWallReactionView[] } }>(
      `/me/groups/${groupId}/wall/${messageId}/reactions`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ kind })
      }
    ),

  getOrganisationReviews: (organisationId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=tenant&targetId=${organisationId}&page=${page}&pageSize=20`
    ),

  createOrganisationReview: (payload: { organisationId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'tenant',
        targetId: payload.organisationId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    }),

    getReviews: (targetType: 'location' | 'tenant', targetId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=${targetType}&targetId=${targetId}&page=${page}&pageSize=20`
    ),

  /** Reviews for a public place — wire targetType remains `location`. */
  getPlaceReviews: (placeId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=location&targetId=${placeId}&page=${page}&pageSize=20`
    ),

    createReview: (payload: { targetType: 'location' | 'tenant'; targetId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    getMyReviews: (page = 1, pageSize = 50) =>
    apiRequest<{ data: MyReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/me/reviews?page=${page}&pageSize=${pageSize}`,
      { auth: true }
    ),

    updateMyReview: (reviewId: string, payload: { rating: number; comment: string }) =>
    apiRequest<{ data: MyReviewDTO }>(`/me/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createPlaceReview: (payload: { placeId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'location',
        targetId: payload.placeId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    }),

    getPosts: (filters?: { category?: string; locationId?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.locationId) params.set('locationId', filters.locationId);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    params.set('pageSize', '50');
    return apiRequest<{ data: PostDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/posts?${params.toString()}`,
      { auth: Boolean(getStoredSession()) }
    );
  },

    getPost: (id: string) => apiRequest<{ data: PostDTO }>(`/posts/${id}`, { auth: Boolean(getStoredSession()) }),

    createPost: (payload: {
    category: string;
    title: string;
    content: string;
    images?: string[];
    locationId?: string;
    activityId?: string;
  }) =>
    apiRequest<{ data: PostDTO }>('/posts', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    replyToPost: (postId: string, content: string) =>
    apiRequest<{ data: PostReplyDTO }>(`/posts/${postId}/replies`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ content })
    }),

    togglePostLike: (postId: string) =>
    apiRequest<{ data: { liked: boolean } }>(`/posts/${postId}/like`, {
      method: 'POST',
      auth: true
    }),

    toggleReplyLike: (postId: string, replyId: string) =>
    apiRequest<{ data: { liked: boolean } }>(`/posts/${postId}/replies/${replyId}/like`, {
      method: 'POST',
      auth: true
    }),

    acceptPostReply: (postId: string, replyId: string) =>
    apiRequest<{ data: PostDTO }>(`/posts/${postId}/replies/${replyId}/accept`, {
      method: 'POST',
      auth: true
    }),

    getMeFavorites: () => apiRequest<{ data: FavoriteDTO[] }>('/me/favorites', { auth: true }),

    checkFavorite: (target: {
    locationId?: string;
    activityId?: string;
    participantIntentId?: string;
    productId?: string;
    merchantId?: string;
    tenantId?: string;
    profileUserId?: string;
  }) => {
    const params = new URLSearchParams();
    if (target.locationId) params.set('locationId', target.locationId);
    if (target.activityId) params.set('activityId', target.activityId);
    if (target.participantIntentId) params.set('participantIntentId', target.participantIntentId);
    if (target.productId) params.set('productId', target.productId);
    if (target.merchantId) params.set('merchantId', target.merchantId);
    if (target.tenantId) params.set('tenantId', target.tenantId);
    if (target.profileUserId) params.set('profileUserId', target.profileUserId);
    return apiRequest<{ data: { saved: boolean; favoriteId: string | null } }>(
      `/me/favorites/check?${params.toString()}`,
      { auth: true }
    );
  },

    addFavorite: (payload: {
    locationId?: string;
    activityId?: string;
    participantIntentId?: string;
    productId?: string;
    merchantId?: string;
    tenantId?: string;
    profileUserId?: string;
    alertOnMatch?: boolean;
    watchOutingCategory?: string | null;
    watchLatitude?: number | null;
    watchLongitude?: number | null;
  }) =>
    apiRequest<{ data: FavoriteDTO }>('/me/favorites', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    removeFavorite: (id: string) =>
    apiRequest(`/me/favorites/${id}`, { method: 'DELETE', auth: true }),

    patchFavoriteAlerts: (id: string, alertOnMatch: boolean) =>
    apiRequest<{ data: { id: string; alertOnMatch: boolean } }>(`/me/favorites/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ alertOnMatch }),
    }),
} as const;
