import { describe, expect, it } from 'vitest';
import { extractActivityTransportRequirementLines } from './activity-transport-requirements.js';

describe('extractActivityTransportRequirementLines', () => {
  it('keeps reach-by and vehicle lines only', () => {
    expect(
      extractActivityTransportRequirementLines([
        'Bring water',
        'Reachable by sedan',
        'Reachable by 4x4 only',
        'Vehicle: SUV',
      ])
    ).toEqual(['Reachable by sedan', 'Reachable by 4x4 only', 'Vehicle: SUV']);
  });

  it('drops join-instruction lines', () => {
    expect(
      extractActivityTransportRequirementLines(['Join: approval required', 'Reachable by sedan'])
    ).toEqual(['Reachable by sedan']);
  });
});
