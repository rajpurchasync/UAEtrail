import { apiRequest } from '../client';

/** BWL — member “looking for company” posts (activity-backed; `participantIntentId` correlation). */
export const seekingApi = {
  listMySeekingPosts: () =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO[] }>(
      '/me/seeking-posts',
      { auth: true }
    ),

  createSeekingPost: (payload: {
    kind: 'hiking' | 'camping' | 'event' | 'guide' | 'rideshare' | 'other';
    title: string;
    date?: string | null;
    time?: string | null;
    preferredArea?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    locationPrecision?: 'general' | 'specific';
    toLatitude?: number | null;
    toLongitude?: number | null;
    partySize: number;
    comment: string;
    areaId?: string | null;
  }) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>('/me/seeking-posts', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true,
    }),

  createSeekingPostJoinRequest: (postId: string, payload?: { note?: string }) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/seeking-posts/${postId}/requests`,
      { method: 'POST', auth: true, body: JSON.stringify(payload ?? {}) }
    ),

  listSeekingPostJoinRequests: (postId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestViewDTO[] }>(
      `/me/seeking-posts/${postId}/requests`,
      { auth: true }
    ),

  getMySeekingPostJoinRequest: (postId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO | null }>(
      `/me/seeking-posts/${postId}/requests/mine`,
      { auth: true }
    ),

  approveSeekingPostJoinRequest: (postId: string, requestId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/seeking-posts/${postId}/requests/${requestId}/approve`,
      { method: 'POST', auth: true }
    ),

  rejectSeekingPostJoinRequest: (postId: string, requestId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/seeking-posts/${postId}/requests/${requestId}/reject`,
      { method: 'POST', auth: true }
    ),

  linkSeekingPostToActivity: (postId: string, activityId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>(
      `/me/seeking-posts/${postId}/link-activity`,
      { method: 'POST', auth: true, body: JSON.stringify({ activityId }) }
    ),

  cancelSeekingPost: (postId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>(
      `/me/seeking-posts/${postId}/cancel`,
      { method: 'POST', auth: true }
    ),

  updateSeekingPost: (
    postId: string,
    payload: Partial<{
      kind: import('@uaetrail/shared-types').ParticipantIntentKind;
      title: string;
      date: string | null;
      time: string | null;
      preferredArea: string | null;
      latitude: number | null;
      longitude: number | null;
      locationPrecision: 'general' | 'specific';
      toLatitude: number | null;
      toLongitude: number | null;
      partySize: number;
      comment: string;
    }>
  ) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>(
      `/me/seeking-posts/${postId}`,
      { method: 'PATCH', auth: true, body: JSON.stringify(payload) }
    ),
} as const;
