import { describe, expect, it } from 'vitest';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { aggregateMemberGoals } from './memberGoalsAggregate';

const goal = (overrides: Partial<MemberGoalDTO>): MemberGoalDTO =>
  ({
    id: 'g1',
    activityFilter: 'hiking',
    targetCount: 8,
    currentCount: 2,
    targetDate: '2026-12-31',
    completed: false,
    countMode: 'join',
    ...overrides,
  }) as MemberGoalDTO;

describe('aggregateMemberGoals', () => {
  it('sums progress across active goals', () => {
    const result = aggregateMemberGoals([
      goal({ id: 'a', currentCount: 2, targetCount: 8 }),
      goal({ id: 'b', currentCount: 1, targetCount: 4 }),
    ]);
    expect(result.totalCurrent).toBe(3);
    expect(result.totalTarget).toBe(12);
    expect(result.progress).toBeCloseTo(0.25);
    expect(result.activeGoals).toHaveLength(2);
  });

  it('ignores completed goals in totals', () => {
    const result = aggregateMemberGoals([
      goal({ id: 'a', completed: true, currentCount: 8, targetCount: 8 }),
      goal({ id: 'b', currentCount: 0, targetCount: 6 }),
    ]);
    expect(result.completedCount).toBe(1);
    expect(result.totalCurrent).toBe(0);
    expect(result.totalTarget).toBe(6);
  });
});
