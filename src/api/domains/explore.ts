import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const exploreApi = {
  getExploreMap: () =>
    apiRequest<{ data: { items: ExploreMapItemDTO[] } }>('/explore/map'),

  listMyParticipantIntents: () =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO[] }>(
      '/me/participant-intents',
      { auth: true }
    ),

  createParticipantIntent: (payload: {
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
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>('/me/participant-intents', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true,
    }),

  createParticipantIntentJoinRequest: (intentId: string, payload?: { note?: string }) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/participant-intents/${intentId}/requests`,
      { method: 'POST', auth: true, body: JSON.stringify(payload ?? {}) }
    ),

  listParticipantIntentJoinRequests: (intentId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestViewDTO[] }>(
      `/me/participant-intents/${intentId}/requests`,
      { auth: true }
    ),

  getMyParticipantIntentJoinRequest: (intentId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO | null }>(
      `/me/participant-intents/${intentId}/requests/mine`,
      { auth: true }
    ),

  approveParticipantIntentJoinRequest: (intentId: string, requestId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/participant-intents/${intentId}/requests/${requestId}/approve`,
      { method: 'POST', auth: true }
    ),

  rejectParticipantIntentJoinRequest: (intentId: string, requestId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentJoinRequestDTO }>(
      `/me/participant-intents/${intentId}/requests/${requestId}/reject`,
      { method: 'POST', auth: true }
    ),

  linkParticipantIntentToActivity: (intentId: string, activityId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>(
      `/me/participant-intents/${intentId}/link-activity`,
      { method: 'POST', auth: true, body: JSON.stringify({ activityId }) }
    ),

  cancelParticipantIntent: (intentId: string) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>(
      `/me/participant-intents/${intentId}/cancel`,
      { method: 'POST', auth: true }
    ),

  updateParticipantIntent: (
    intentId: string,
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
      `/me/participant-intents/${intentId}`,
      { method: 'PATCH', auth: true, body: JSON.stringify(payload) }
    ),
} as const;
