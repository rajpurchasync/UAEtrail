import { describe, expect, it } from 'vitest';
import { activityTypeCountsForGoal } from '../src/lib/member-goals-store.js';

describe('member goal activity filters', () => {
  it('counts only matching outing types', () => {
    expect(activityTypeCountsForGoal('HIKING', 'hiking')).toBe(true);
    expect(activityTypeCountsForGoal('hiking', 'hiking')).toBe(true);
    expect(activityTypeCountsForGoal('CAMPING', 'hiking')).toBe(false);
    expect(activityTypeCountsForGoal('HIKING', 'all_outings')).toBe(true);
    expect(activityTypeCountsForGoal(null, 'camping')).toBe(false);
  });
});
