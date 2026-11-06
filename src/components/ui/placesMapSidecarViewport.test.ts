import { describe, expect, it } from 'vitest';
import { resolveSidecarSessionZoom, sidecarFocusCenter } from './placesMapSidecarViewport';
import { MAP_CONFIG } from '../../config/platform';

describe('placesMapSidecarViewport', () => {
  it('resolveSidecarSessionZoom prefers in-memory session zoom', () => {
    expect(resolveSidecarSessionZoom(11, 8)).toBe(11);
    expect(resolveSidecarSessionZoom(null, 9)).toBe(9);
    expect(resolveSidecarSessionZoom(null, MAP_CONFIG.exploreDefaultZoom)).toBe(
      MAP_CONFIG.exploreDefaultZoom
    );
  });

  it('sidecarFocusCenter averages multiple coords', () => {
    expect(sidecarFocusCenter([{ lat: 24, lng: 54 }, { lat: 26, lng: 56 }])).toEqual({
      lat: 25,
      lng: 55,
    });
  });
});
