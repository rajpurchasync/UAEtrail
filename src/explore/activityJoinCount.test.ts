import { describe, expect, it } from 'vitest';
import { activityHasJoinedParticipants } from '@uaetrail/shared-types';

describe('activityHasJoinedParticipants', () => {
  it('is false when capacity is unchanged', () => {
    expect(activityHasJoinedParticipants({ slotsTotal: 8, slotsAvailable: 8 })).toBe(false);
  });

  it('is true when at least one spot is taken', () => {
    expect(activityHasJoinedParticipants({ slotsTotal: 8, slotsAvailable: 7 })).toBe(true);
  });
});
