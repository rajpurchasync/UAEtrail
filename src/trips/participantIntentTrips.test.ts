import { describe, expect, it } from 'vitest';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { partitionParticipantIntentsForTrips } from './participantIntentTrips';

const baseIntent = (overrides: Partial<ParticipantIntentDTO>): ParticipantIntentDTO => ({
  id: 'int-1',
  userId: 'user-1',
  kind: 'hiking',
  title: 'Hike Friday',
  date: '2026-12-01',
  time: null,
  preferredArea: null,
  latitude: null,
  longitude: null,
  locationPrecision: null,
  toLatitude: null,
  toLongitude: null,
  partySize: 2,
  comment: 'Looking for company',
  status: 'active',
  convertedActivityId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('partitionParticipantIntentsForTrips', () => {
  it('keeps active intents in upcoming', () => {
    const { upcoming, completed } = partitionParticipantIntentsForTrips([
      baseIntent({ status: 'active' }),
    ]);
    expect(upcoming).toHaveLength(1);
    expect(completed).toHaveLength(0);
  });

  it('moves fulfilled and cancelled to completed', () => {
    const { upcoming, completed } = partitionParticipantIntentsForTrips([
      baseIntent({ id: 'a', status: 'fulfilled' }),
      baseIntent({ id: 'b', status: 'cancelled' }),
    ]);
    expect(upcoming).toHaveLength(0);
    expect(completed).toHaveLength(2);
  });
});
