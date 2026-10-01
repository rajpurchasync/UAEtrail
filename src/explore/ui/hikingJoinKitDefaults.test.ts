import { describe, expect, it } from 'vitest';
import { DEFAULT_HIKING_JOIN_KIT, ensureHikingJoinKitText } from './hikingJoinKitDefaults';

describe('hikingJoinKitDefaults', () => {
  it('seeds default mandatory and recommended lines when empty', () => {
    expect(ensureHikingJoinKitText('')).toBe(DEFAULT_HIKING_JOIN_KIT);
    expect(DEFAULT_HIKING_JOIN_KIT).toContain('Mandatory:');
    expect(DEFAULT_HIKING_JOIN_KIT).toContain('💧 2 Liter water');
    expect(DEFAULT_HIKING_JOIN_KIT).toContain('Not allowed:');
    expect(DEFAULT_HIKING_JOIN_KIT).toContain('🩴');
  });

  it('keeps custom text when provided', () => {
    expect(ensureHikingJoinKitText('Bring poles only')).toBe('Bring poles only');
  });
});
