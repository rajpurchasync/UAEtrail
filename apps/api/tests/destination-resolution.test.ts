import { describe, expect, it } from 'vitest';
import {
  approximateAreaBoundsKm2,
  pointInAreaBounds,
  type AreaBoundsRing,
} from '@uaetrail/shared-types';
import { resolveDestinationIdFromPoint, ringFromBBox } from '../src/lib/destination-resolution.js';
import type { AreaDTO } from '@uaetrail/shared-types';

const box = ringFromBBox(24.78, 56.0, 24.88, 56.18);

describe('pointInAreaBounds', () => {
  it('detects interior and exterior points', () => {
    expect(pointInAreaBounds(24.83, 56.09, box)).toBe(true);
    expect(pointInAreaBounds(25.5, 56.09, box)).toBe(false);
  });
});

describe('resolveDestinationIdFromPoint', () => {
  const destinations: AreaDTO[] = [
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

  it('prefers persisted destinationId when set', () => {
    expect(resolveDestinationIdFromPoint(24.83, 56.09, destinations, 'place-dest')).toBe('place-dest');
  });

  it('picks smallest priority then smallest polygon', () => {
    expect(resolveDestinationIdFromPoint(24.83, 56.09, destinations, null)).toBe('small');
  });
});

describe('approximateAreaBoundsKm2', () => {
  it('returns positive area for a box', () => {
    const ring: AreaBoundsRing = ringFromBBox(0, 0, 1, 1);
    expect(approximateAreaBoundsKm2(ring)).toBeGreaterThan(0);
  });
});