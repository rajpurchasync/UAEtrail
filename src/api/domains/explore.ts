import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const exploreApi = {
  getExploreMap: () =>
    apiRequest<{ data: { items: ExploreMapItemDTO[] } }>('/explore/map'),
  createParticipantIntent: (payload: {
    kind: 'hiking' | 'camping' | 'event' | 'guide' | 'carpool' | 'other';
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
} as const;
