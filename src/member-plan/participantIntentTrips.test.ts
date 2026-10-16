import { describe, expect, it } from 'vitest';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { partitionParticipantIntentsForPlanHub } from './participantIntentPlan';

const intent = (overrides: Partial<ParticipantIntentDTO>): ParticipantIntentDTO =>
  ({
    id: 'i1',
    status: 'active',
    kind: 'hiking',
    ...overrides,
  }) as ParticipantIntentDTO;

describe('partitionParticipantIntentsForPlanHub', () => {
  it('splits active vs terminal intents', () => {
    const { upcoming, completed } = partitionParticipantIntentsForPlanHub([
      intent({ id: 'a', status: 'active' }),
      intent({ id: 'b', status: 'fulfilled' }),
      intent({ id: 'c', status: 'cancelled' }),
    ]);
    expect(upcoming.map((i) => i.id)).toEqual(['a']);
    expect(completed.map((i) => i.id)).toEqual(['b', 'c']);
  });

  it('returns empty buckets for no intents', () => {
    const { upcoming, completed } = partitionParticipantIntentsForPlanHub([]);
    expect(upcoming).toEqual([]);
    expect(completed).toEqual([]);
  });
});
