import { describe, expect, it } from 'vitest';
import {
  JOIN_LAYER_MODULES,
  MODULE_LAYER_MATRIX,
  PLATFORM_LAYERS,
  isPlatformLayer,
} from './platform-layers.js';

describe('platform layers (MIG-PLATFORM-LAYER-SPINE)', () => {
  it('defines six platform layers', () => {
    expect(PLATFORM_LAYERS).toEqual([
      'publish',
      'discover',
      'join',
      'connect',
      'plan',
      'manage',
    ]);
    expect(isPlatformLayer('discover')).toBe(true);
    expect(isPlatformLayer('engage')).toBe(false);
  });

  it('crew module does not include join (outing commit is activity-only)', () => {
    expect(MODULE_LAYER_MATRIX.crew).not.toContain('join');
    expect(JOIN_LAYER_MODULES).toEqual(['activity']);
  });

  it('place module does not include join or connect on matrix', () => {
    expect(MODULE_LAYER_MATRIX.place).not.toContain('join');
    expect(MODULE_LAYER_MATRIX.place).not.toContain('connect');
  });
});