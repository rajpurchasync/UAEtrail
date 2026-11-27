import { describe, expect, it } from 'vitest';
import {
  resolveListHoverMapFocus,
  resolveSidecarSessionZoom,
  sidecarFocusCenter,
} from './placesMapSidecarViewport';
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

  it('resolveListHoverMapFocus prefers card point / rideshare from over from→to midpoint', () => {
    const marina = { latitude: 25.08, longitude: 55.14, rideshareEndpoint: 'from' as const };
    const jais = { latitude: 25.9433, longitude: 56.1422, rideshareEndpoint: 'to' as const };
    expect(resolveListHoverMapFocus([marina, jais], { lat: 25.08, lng: 55.14 })).toEqual({
      lat: 25.08,
      lng: 55.14,
    });
    expect(resolveListHoverMapFocus([marina, jais])).toEqual({ lat: 25.08, lng: 55.14 });
    expect(resolveListHoverMapFocus([jais, marina])).toEqual({ lat: 25.08, lng: 55.14 });
  });
});
