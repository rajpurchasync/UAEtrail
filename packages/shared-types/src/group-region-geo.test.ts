import { describe, expect, it } from 'vitest';
import {
  groupRegionAnchorForLabel,
  normalizeGroupRegionLabel,
  resolveGroupRegionAreaAnchor,
  inferEmirateFromLocalityName,
  resolveGroupRegionFromCoordinates,
  resolveGroupRegionLabel,
} from './group-region-geo.js';

describe('group-region-geo', () => {
  it('normalizes common region spellings', () => {
    expect(normalizeGroupRegionLabel('Ras Al Khaimah')).toBe('RAK');
    expect(normalizeGroupRegionLabel('alain')).toBe('Abu Dhabi');
    expect(normalizeGroupRegionLabel('UAQ')).toBe('Umm Al Quwain');
    expect(normalizeGroupRegionLabel('Dibba Al-Hisn')).toBe('Sharjah');
  });

  it('resolves group regions from coordinates', () => {
    expect(resolveGroupRegionFromCoordinates(25.2048, 55.2708)).toBe('Dubai');
    expect(resolveGroupRegionFromCoordinates(24.22, 55.76)).toBe('Abu Dhabi');
    expect(resolveGroupRegionFromCoordinates(24.82, 56.13)).toBe('Dubai');
    expect(resolveGroupRegionFromCoordinates(25.12, 56.34)).toBe('Fujairah');
    expect(resolveGroupRegionFromCoordinates(25.33, 56.34)).toBe('Sharjah');
    expect(resolveGroupRegionFromCoordinates(24.45, 54.37)).toBe('Abu Dhabi');
    expect(resolveGroupRegionFromCoordinates(25.923, 56.115)).toBe('RAK');
  });

  it('separates Hatta, Masfut, Sharjah city, Ajman, and RAK instead of one fat box', () => {
    expect(resolveGroupRegionFromCoordinates(24.813, 56.052)).toBe('Ajman'); // Masfut
    expect(resolveGroupRegionFromCoordinates(24.796, 56.127)).toBe('Dubai'); // Hatta Dam
    expect(resolveGroupRegionFromCoordinates(25.346, 55.421)).toBe('Sharjah');
    expect(resolveGroupRegionFromCoordinates(25.411, 55.435)).toBe('Ajman');
    expect(resolveGroupRegionFromCoordinates(25.106, 56.048)).toBe('RAK'); // Wadi Shawka
    expect(resolveGroupRegionFromCoordinates(25.325, 56.022)).toBe('Ajman'); // Manama
    expect(resolveGroupRegionFromCoordinates(25.07, 56.355)).toBe('Sharjah'); // Kalba
    expect(resolveGroupRegionFromCoordinates(25.288, 55.88)).toBe('Sharjah'); // Dhaid
    expect(resolveGroupRegionFromCoordinates(24.978, 56.226)).toBe('Sharjah'); // Wadi Al Helo
    expect(resolveGroupRegionFromCoordinates(25.282, 55.375)).toBeNull(); // Al Nahda mix
  });

  it('infers Sharjah from Wadi Al Helo in the name when the pin is off-box', () => {
    expect(inferEmirateFromLocalityName('Wadi Al Helo dam hike')).toBe('Sharjah');
  });

  it('does not let a wide Hatta published polygon steal Masfut', () => {
    const fatHatta = [
      {
        id: 'area-hatta',
        region: 'Dubai',
        priority: 10,
        bounds: [
          { latitude: 24.75, longitude: 55.95 },
          { latitude: 24.75, longitude: 56.25 },
          { latitude: 24.92, longitude: 56.25 },
          { latitude: 24.92, longitude: 55.95 },
        ],
      },
    ];
    expect(resolveGroupRegionFromCoordinates(24.813, 56.052, { publishedAreas: fatHatta })).toBe(
      'Ajman'
    );
    expect(resolveGroupRegionFromCoordinates(24.82, 56.13, { publishedAreas: fatHatta })).toBe(
      'Dubai'
    );
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

