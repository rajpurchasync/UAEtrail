import { describe, expect, it } from 'vitest';
import {
  buildGroupRegionLevels,
  readGroupRegionAtLevel,
  resolveGroupRegionBrowseKey,
  GROUP_REGION_LEVEL,
} from './group-region.js';
import { stampGroupRegionLevelsFromGeo } from './group-region-geo.js';

describe('group-region levels', () => {
  it('reads values by level', () => {
    const levels = { l1: 'AE', l2: 'Dubai', l3: 'Hatta', l4: 'Wadi Hub' };
    expect(readGroupRegionAtLevel(levels, GROUP_REGION_LEVEL.country)).toBe('AE');
    expect(readGroupRegionAtLevel(levels, GROUP_REGION_LEVEL.state)).toBe('Dubai');
    expect(readGroupRegionAtLevel(levels, GROUP_REGION_LEVEL.city)).toBe('Hatta');
    expect(readGroupRegionAtLevel(levels, GROUP_REGION_LEVEL.district)).toBe('Wadi Hub');
  });

  it('stamps UAE levels from pin (L2 emirate, L3 locality when distinct)', () => {
    const levels = stampGroupRegionLevelsFromGeo({
      countryCode: 'ae',
      region: 'Hatta',
      latitude: 24.82,
      longitude: 56.13,
    });
    expect(levels.l1).toBe('AE');
    expect(levels.l2).toBe('Dubai');
    expect(levels.l3).toBe('Hatta');
  });

  it('resolveGroupRegionBrowseKey uses UAE L2 emirate', () => {
    const levels = { l1: 'AE', l2: 'Dubai', l3: 'Hatta', l4: null };
    expect(resolveGroupRegionBrowseKey('AE', levels)).toBe('Dubai');
    expect(resolveGroupRegionBrowseKey('ae', levels)).toBe('Dubai');
  });

  it('buildGroupRegionLevels keeps explicit L2 from form hint', () => {
    const levels = buildGroupRegionLevels({
      countryCode: 'AE',
      stateHint: 'Sharjah',
      region: 'Kalba',
      areaLabel: 'Beach',
      normalizeState: (raw) => raw,
    });
    expect(levels.l2).toBe('Sharjah');
    expect(levels.l3).toBe('Kalba');
    expect(levels.l4).toBe('Beach');
  });
});
