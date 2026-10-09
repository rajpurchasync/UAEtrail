import { describe, expect, it } from 'vitest';
import {
  approximateAreaBoundsKm2,
  pointInAreaBounds,
  type AreaBoundsRing,
} from '@uaetrail/shared-types';
import { resolveAreaIdFromPoint, ringFromBBox } from '../src/lib/area-resolution.js';
import type { AreaDTO } from '@uaetrail/shared-types';

const box = ringFromBBox(24.78, 56.0, 24.88, 56.18);

describe('pointInAreaBounds', () => {
  it('detects interior and exterior points', () => {
    expect(pointInAreaBounds(24.83, 56.09, box)).toBe(true);
    expect(pointInAreaBounds(25.5, 56.09, box)).toBe(false);
  });
});

describe('resolveAreaIdFromPoint', () => {
  const areas: AreaDTO[] = [
    {
      id: 'large',
      slug: 'large',
      name: 'Large',
      region: 'Dubai',
      status: 'published',
      center: { latitude: 24.83, longitude: 56.09 },
      bounds: box,
      priority: 50,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'small',
      slug: 'small',
      name: 'Small',
      region: 'Dubai',
      status: 'published',
      center: { latitude: 24.83, longitude: 56.09 },
      bounds: ringFromBBox(24.8, 56.05, 24.86, 56.12),
      priority: 10,
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('prefers place.areaId when set', () => {
    expect(resolveAreaIdFromPoint(24.83, 56.09, areas, 'place-area')).toBe('place-area');
  });

  it('picks smallest priority then smallest polygon', () => {
    expect(resolveAreaIdFromPoint(24.83, 56.09, areas, null)).toBe('small');
  });
});

describe('approximateAreaBoundsKm2', () => {
  it('returns positive area for a box', () => {
    const ring: AreaBoundsRing = ringFromBBox(0, 0, 1, 1);
    expect(approximateAreaBoundsKm2(ring)).toBeGreaterThan(0);
  });
});
