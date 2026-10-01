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
  }) =>
    apiRequest<{ data: import('@uaetrail/shared-types').ParticipantIntentDTO }>('/me/participant-intents', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: true,
    }),

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
