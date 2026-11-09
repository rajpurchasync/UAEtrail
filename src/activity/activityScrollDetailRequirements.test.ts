import { describe, expect, it } from 'vitest';
import { resolveActivityScrollRequirementLines } from './activityScrollDetailRequirements';

describe('resolveActivityScrollRequirementLines', () => {
  it('keeps bring-list lines and drops transport + trail metadata', () => {
    const lines = resolveActivityScrollRequirementLines([
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
