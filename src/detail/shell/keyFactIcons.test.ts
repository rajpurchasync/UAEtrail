import { describe, expect, it } from 'vitest';
import { keyFactIconKindFromLabel } from './keyFactIcons';

describe('keyFactIcons', () => {
  it('maps common key fact labels to icon kinds', () => {
    expect(keyFactIconKindFromLabel('Length')).toBe('length');
    expect(keyFactIconKindFromLabel('Duration')).toBe('duration');
    expect(keyFactIconKindFromLabel('Elevation')).toBe('elevation');
    expect(keyFactIconKindFromLabel('Difficulty')).toBe('difficulty');
    expect(keyFactIconKindFromLabel('Capacity')).toBe('capacity');
  });
});
