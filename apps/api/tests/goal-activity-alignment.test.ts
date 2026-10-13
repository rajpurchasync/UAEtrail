import { describe, expect, it } from 'vitest';
import {
  activityTypeCountsForGoal,
  mapPinActivityTypeCountsForGoal,
} from '../src/lib/goal-activity-alignment.js';

describe('goal activity alignment', () => {
  it('maps map pin types to hiking goal', () => {
    expect(mapPinActivityTypeCountsForGoal('hike', 'hiking')).toBe(true);
    expect(mapPinActivityTypeCountsForGoal('trail_run', 'hiking')).toBe(true);
    expect(mapPinActivityTypeCountsForGoal('camp', 'hiking')).toBe(false);
  });

  it('maps map pin types to camping goal', () => {
    expect(mapPinActivityTypeCountsForGoal('camp', 'camping')).toBe(true);
    expect(mapPinActivityTypeCountsForGoal('hike', 'camping')).toBe(false);
  });

  it('counts scheduled activity types for host goals', () => {
    expect(activityTypeCountsForGoal('HIKING', 'hiking')).toBe(true);
    expect(activityTypeCountsForGoal('CAMPING', 'hiking')).toBe(false);
    expect(activityTypeCountsForGoal('HIKING', 'all_outings')).toBe(true);
    expect(activityTypeCountsForGoal(null, 'camping')).toBe(false);
  });
});
