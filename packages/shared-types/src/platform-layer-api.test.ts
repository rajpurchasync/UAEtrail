import { describe, expect, it } from 'vitest';
import { PLATFORM_LAYERS } from './platform-layers.js';
import { PLATFORM_LAYER_API_MODULES } from './platform-layer-api.js';

describe('platform layer api modules (MIG-PLATFORM-LAYER-SPINE)', () => {
  it('maps every platform layer to domain module stems', () => {
    for (const layer of PLATFORM_LAYERS) {
      expect(PLATFORM_LAYER_API_MODULES[layer].length).toBeGreaterThan(0);
    }
    expect(PLATFORM_LAYER_API_MODULES.join).toContain('activities');
    expect(PLATFORM_LAYER_API_MODULES.connect).toContain('friends');
    expect(PLATFORM_LAYER_API_MODULES.plan).toContain('wishlist');
  });
});