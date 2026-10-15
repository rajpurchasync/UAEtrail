import { describe, expect, it } from 'vitest';
import { buildPlaceDetailPageModel, resolvePlaceDetailBackKind } from './buildPlaceDetailPageModel';
import type { Place } from '../../types/place';

const basePlace = (overrides: Partial<Place> = {}): Place =>
  ({
    id: 'p1',
    name: 'Hatta',
    region: 'Dubai',
    distance: 8,
    season: ['winter'],
    ...overrides,
  }) as Place;

describe('buildPlaceDetailPageModel', () => {
  it('maps trail kind to backKind trail and trail share copy', () => {
    const model = buildPlaceDetailPageModel({
      kind: 'trail',
      place: basePlace(),
    });
    expect(resolvePlaceDetailBackKind('trail')).toBe('trail');
    expect(model.backKind).toBe('trail');
    expect(model.shareText).toMatch(/8 km trail/);
    expect(model.config.pathPrefix).toBe('/trail');
  });

  it('uses config share suffix for camp without trail distance copy', () => {
    const model = buildPlaceDetailPageModel({
      kind: 'camp',
      place: basePlace({ distance: undefined }),
    });
    expect(model.backKind).toBe('camp');
    expect(model.shareText).toMatch(/Dubai/);
    expect(model.shareText).not.toMatch(/km trail/);
  });
});
