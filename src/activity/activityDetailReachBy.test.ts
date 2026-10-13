import { describe, expect, it } from 'vitest';
import { extractActivityPlanDetailLines, extractActivityTransportReachLines } from './activityDetailReachBy';

describe('activityDetailReachBy', () => {
  it('splits reach-by lines for Transport tab', () => {
    const requirements = ['Bring water', 'Reachable by: car pool', 'Vehicle: 4x4 recommended'];
    expect(extractActivityTransportReachLines(requirements)).toEqual([
      'Reachable by: car pool',
      'Vehicle: 4x4 recommended',
    ]);
    expect(extractActivityPlanDetailLines(requirements)).toEqual(['Bring water']);
  });
});
