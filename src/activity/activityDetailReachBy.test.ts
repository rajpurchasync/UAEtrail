import { describe, expect, it } from 'vitest';
import {
  extractActivityPlanDetailLines,
  extractActivityTransportReachLines,
  formatActivityAccessibleBySummary,
} from './activityDetailReachBy';

describe('activityDetailReachBy', () => {
  it('splits reach-by lines for Transport tab', () => {
    const requirements = ['Bring water', 'Reachable by: car pool', 'Vehicle: 4x4 recommended'];
    expect(extractActivityTransportReachLines(requirements)).toEqual([
      'Reachable by: car pool',
      'Vehicle: 4x4 recommended',
    ]);
    expect(extractActivityPlanDetailLines(requirements)).toEqual(['Bring water']);
  });

  it('formats organize reach lines for transport strip', () => {
    expect(
      formatActivityAccessibleBySummary(['Reachable by sedan', 'Reachable by 4x4 only'])
    ).toBe('car, 4x4');
  });
});
