import { describe, expect, it } from 'vitest';
import {
  groupRegionAnchorForLabel,
  normalizeGroupRegionLabel,
  resolveGroupRegionAreaAnchor,
  resolveGroupRegionFromCoordinates,
  resolveGroupRegionLabel,
} from './group-region-geo.js';

describe('group-region-geo', () => {
  it('normalizes common region spellings', () => {
    expect(normalizeGroupRegionLabel('Ras Al Khaimah')).toBe('RAK');
    expect(normalizeGroupRegionLabel('alain')).toBe('Al Ain');
    expect(normalizeGroupRegionLabel('UAQ')).toBe('Umm Al Quwain');
  });

  it('resolves group regions from coordinates', () => {
    expect(resolveGroupRegionFromCoordinates(25.2048, 55.2708)).toBe('Dubai');
    expect(resolveGroupRegionFromCoordinates(24.22, 55.76)).toBe('Al Ain');
    expect(resolveGroupRegionFromCoordinates(24.82, 56.13)).toBe('Dubai');
    expect(resolveGroupRegionFromCoordinates(25.12, 56.34)).toBe('Fujairah');
    expect(resolveGroupRegionFromCoordinates(25.33, 56.34)).toBe('Sharjah');
    expect(resolveGroupRegionFromCoordinates(24.45, 54.37)).toBe('Abu Dhabi');
    expect(resolveGroupRegionFromCoordinates(25.923, 56.115)).toBe('RAK');
  });

  it('returns the emirate center, not the device coordinate', () => {
    const anchor = resolveGroupRegionAreaAnchor(25.2048, 55.2708);
    expect(anchor?.label).toBe('Dubai');
    expect(anchor?.latitude).not.toBeCloseTo(25.2048, 2);
    expect(anchor?.longitude).not.toBeCloseTo(55.2708, 2);
    expect(groupRegionAnchorForLabel('Sharjah').label).toBe('Sharjah');
  });

  it('prefers explicit state hint over coordinates', () => {
    expect(
      resolveGroupRegionLabel({
        stateHint: 'Sharjah',
        latitude: 25.2048,
        longitude: 55.2708,
      })
    ).toBe('Sharjah');
  });
});

