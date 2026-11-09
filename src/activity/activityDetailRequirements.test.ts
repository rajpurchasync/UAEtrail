import { describe, expect, it } from 'vitest';
import { resolveActivityDetailRequirementLines } from './activityDetailRequirements';

describe('resolveActivityDetailRequirementLines', () => {
  it('keeps bring-list lines and drops transport + trail metadata', () => {
    const lines = resolveActivityDetailRequirementLines([
      'Water 1.5L',
      'Trail shoes',
      'Reachable by: 4x4',
      'Trail: Wadi Loop',
      'Difficulty: Moderate',
      'Vehicle: SUV',
      'Packing ack: strict',
      'Packing item: must|shoes|🥾|Hiking Shoes',
    ]);
    expect(lines).toEqual(['Water 1.5L', 'Trail shoes']);
  });
});
