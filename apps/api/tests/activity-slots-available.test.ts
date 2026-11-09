import { describe, expect, it } from 'vitest';
import {
  resolveActivityParticipantSlotsUsed,
  resolveActivitySlotsAvailable,
} from '../src/lib/mappers.js';
import { ActivityStatus } from '../src/domain/enums.js';

describe('resolveActivitySlotsAvailable', () => {
  const base = {
    capacity: 20,
    status: ActivityStatus.PUBLISHED,
    schemaVersion: 2,
    counts: { going: 0, waitlisted: 0, pending: 0 },
  };

  it('uses participantSlotsUsed when counts.going is stale on schema v2', () => {
    expect(
      resolveActivitySlotsAvailable({
        ...base,
        participantSlotsUsed: 1,
      } as Parameters<typeof resolveActivitySlotsAvailable>[0])
    ).toBe(19);
  });

  it('prefers the higher of participantSlotsUsed, counts.going, and participant rows', () => {
    expect(
      resolveActivityParticipantSlotsUsed({
        ...base,
        participantSlotsUsed: 2,
        counts: { going: 5, waitlisted: 0, pending: 0 },
        participants: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      } as Parameters<typeof resolveActivityParticipantSlotsUsed>[0])
    ).toBe(5);
  });
});
