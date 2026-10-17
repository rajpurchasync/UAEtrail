import { beforeEach, describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildExploreMapBboxPage,
  exploreMapItemIntersectsBbox,
  filterExploreMapItemsByBbox,
  isExploreMapBboxEnabled,
  paginateExploreMapItems,
  parseExploreMapBboxParam,
} from '../src/lib/explore-map-bbox.js';

const pin = (id: string, lat: number, lng: number, date?: string): ExploreMapItemDTO =>
  ({
    id,
    kind: 'hiking',
    source: 'activity',
    title: id,
    latitude: lat,
    longitude: lng,
    path: `/activity/${id}`,
    date: date ?? null,
  }) as ExploreMapItemDTO;

describe('explore-map-bbox', () => {
  beforeEach(() => {
    delete process.env.EXPLORE_MAP_BBOX;
  });

  it('isExploreMapBboxEnabled requires exact "1"', () => {
    expect(isExploreMapBboxEnabled()).toBe(false);
    process.env.EXPLORE_MAP_BBOX = '1';
    expect(isExploreMapBboxEnabled()).toBe(true);
  });

  it('parseExploreMapBboxParam accepts west,south,east,north and clamps to UAE', () => {
    const bbox = parseExploreMapBboxParam('54,24,56,26');
    expect(bbox.west).toBe(54);
    expect(bbox.south).toBe(24);
    expect(bbox.east).toBe(56);
    expect(bbox.north).toBe(26);
  });

  it('filterExploreMapItemsByBbox keeps pins inside or carpool destination inside', () => {
    const bbox = parseExploreMapBboxParam('55,25,55.5,25.5');
    const inside = pin('activity:in', 25.2, 55.2);
    const outside = pin('activity:out', 24.0, 54.0);
    const destOnly = {
      ...pin('activity:dest', 24.0, 54.0),
      latitude: 24.0,
      longitude: 54.0,
      toLatitude: 25.25,
      toLongitude: 55.25,
    } as ExploreMapItemDTO;
    const filtered = filterExploreMapItemsByBbox([inside, outside, destOnly], bbox);
    expect(filtered.map((item) => item.id)).toEqual(['activity:in', 'activity:dest']);
    expect(exploreMapItemIntersectsBbox(inside, bbox)).toBe(true);
    expect(exploreMapItemIntersectsBbox(outside, bbox)).toBe(false);
  });

  it('paginateExploreMapItems returns stable cursor pages', () => {
    const items = [
      pin('activity:a', 25, 55, '2026-10-10'),
      pin('activity:b', 25, 55, '2026-10-12'),
      pin('activity:c', 25, 55, '2026-10-14'),
    ];
    const first = paginateExploreMapItems({ items, limit: 2, cursor: null });
    expect(first.items.map((item) => item.id)).toEqual(['activity:a', 'activity:b']);
    expect(first.nextCursor).toBeTruthy();
    const second = paginateExploreMapItems({
      items,
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.items.map((item) => item.id)).toEqual(['activity:c']);
    expect(second.nextCursor).toBeNull();
  });

  it('buildExploreMapBboxPage applies bbox and area slug', () => {
    const items = [
      { ...pin('activity:dxb', 25.2, 55.2), areaSlug: 'dubai' } as ExploreMapItemDTO,
      { ...pin('activity:other', 25.2, 55.2), areaSlug: 'fujairah' } as ExploreMapItemDTO,
    ];
    const bbox = parseExploreMapBboxParam('55,25,56,26');
    const page = buildExploreMapBboxPage({
      items,
      bbox,
      areaSlug: 'dubai',
      limit: 50,
      cursor: null,
    });
    expect(page.items.map((item) => item.id)).toEqual(['activity:dxb']);
    expect(page.region.slug).toBe('dubai');
  });
});
