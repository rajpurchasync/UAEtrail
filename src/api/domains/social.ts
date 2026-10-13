import {
  BuddyRelationshipDTO,
  BuddyRequestDTO,
  BuddySummaryDTO,
  MemberFollowStateDTO,
  MemberFollowSummaryDTO,
  MemberProfileStatsDTO,
  EntityFollowCheckDTO,
  EntityFollowDTO,
  WishlistItemDTO,
  ReviewDTO,
  MyReviewDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';
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

    getMeProfileStats: () =>
      apiRequest<{ data: MemberProfileStatsDTO }>('/me/profile-stats', { auth: true }),

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

    updateMeGroupSettings: (
      groupId: string,
      payload: {
        wallPostPolicy?: 'all_members' | 'admins_only';
        photoUrl?: string | null;
      }
    ) =>
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

    getMeGroupWall: (
      groupId: string,
      options?: { since?: string; before?: string; beforeMessageId?: string; limit?: number }
    ) => {
      const params = new URLSearchParams();
      if (options?.since) params.set('since', options.since);
      if (options?.before) params.set('before', options.before);
      if (options?.beforeMessageId) params.set('beforeMessageId', options.beforeMessageId);
      if (options?.limit) params.set('limit', String(options.limit));
      const qs = params.toString();
      return apiRequest<{
        data: SocialGroupWallMessageView[];
        meta?: { hasMoreOlder: boolean };
      }>(`/me/groups/${groupId}/wall${qs ? `?${qs}` : ''}`, { auth: true });
    },

    markMeGroupWallRead: (groupId: string) =>
    apiRequest<{ data: { read: boolean } }>(`/me/groups/${groupId}/wall/read`, {
      method: 'POST',
      auth: true,
    }),

    createMeGroupWallPost: (
      groupId: string,
      body: string,
      options?: { replyToMessageId?: string }
    ) =>
    apiRequest<{ data: SocialGroupWallMessageView }>(`/me/groups/${groupId}/wall`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        body,
        ...(options?.replyToMessageId ? { replyToMessageId: options.replyToMessageId } : {}),
      }),
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

    getReviews: (
      targetType: 'location' | 'tenant' | 'activity',
      targetId: string,
      page = 1
    ) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=${targetType}&targetId=${targetId}&page=${page}&pageSize=20`
    ),

  getActivityReviews: (activityId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=activity&targetId=${activityId}&page=${page}&pageSize=20`
    ),

  /** Reviews for a public place — wire targetType remains `location`. */
  getPlaceReviews: (placeId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=location&targetId=${placeId}&page=${page}&pageSize=20`
    ),

    createReview: (payload: {
      targetType: 'location' | 'tenant' | 'activity';
      targetId: string;
      rating: number;
      comment: string;
    }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  createActivityReview: (payload: { activityId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        targetType: 'activity',
        targetId: payload.activityId,
        rating: payload.rating,
        comment: payload.comment,
      }),
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

    getMeEntityFollows: () =>
      apiRequest<{ data: EntityFollowDTO[] }>('/me/entity-follows', { auth: true }),

    checkEntityFollow: (target: { locationId?: string; tenantId?: string; merchantId?: string }) => {
      const params = new URLSearchParams();
      if (target.locationId) params.set('locationId', target.locationId);
      if (target.tenantId) params.set('tenantId', target.tenantId);
      if (target.merchantId) params.set('merchantId', target.merchantId);
      return apiRequest<{ data: EntityFollowCheckDTO }>(
        `/me/entity-follows/check?${params.toString()}`,
        { auth: true }
      );
    },

    followEntity: (payload: { locationId?: string; tenantId?: string; merchantId?: string }) =>
      apiRequest<{ data: EntityFollowDTO }>('/me/entity-follows', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),

    unfollowEntity: (id: string) =>
      apiRequest(`/me/entity-follows/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),

    getMeWishlist: () => apiRequest<{ data: WishlistItemDTO[] }>('/me/wishlist', { auth: true }),

    checkWishlist: (target: { locationId?: string; activityId?: string }) => {
      const params = new URLSearchParams();
      if (target.locationId) params.set('locationId', target.locationId);
      if (target.activityId) params.set('activityId', target.activityId);
      return apiRequest<{ data: { saved: boolean; wishlistItemId: string | null } }>(
        `/me/wishlist/check?${params.toString()}`,
        { auth: true }
      );
    },

    addWishlistItem: (payload: {
      locationId?: string;
      activityId?: string;
      alertOnMatch?: boolean;
      watchOutingCategory?: string | null;
      watchLatitude?: number | null;
      watchLongitude?: number | null;
    }) =>
      apiRequest<{ data: WishlistItemDTO }>('/me/wishlist', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),

    removeWishlistItem: (id: string) =>
      apiRequest(`/me/wishlist/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),

    patchWishlistAlerts: (id: string, alertOnMatch: boolean) =>
      apiRequest<{ data: { id: string; alertOnMatch: boolean } }>(
        `/me/wishlist/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify({ alertOnMatch }),
        }
      ),

} as const;
