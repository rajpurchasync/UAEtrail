import { describe, expect, it } from 'vitest';
import {
  applyGuestExploreMapCatalogCap,
  compareGuestPreviewEvents,
  compareGuestPreviewPlaces,
  GUEST_EXPLORE_MAP_MAX_EVENTS,
  GUEST_EXPLORE_MAP_MAX_PLACES,
  isGuestExploreMapCatalogCapEnabled,
} from '../src/lib/explore-map-guest-catalog-cap.js';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

const place = (id: string, updatedAt: string): ExploreMapItemDTO =>
  ({
    id,
    kind: 'trail',
    source: 'venue',
    title: id,
    latitude: 25,
    longitude: 55,
    path: `/place/${id}`,
    catalogUpdatedAt: updatedAt,
  }) as ExploreMapItemDTO;

const event = (id: string, postedAt: string): ExploreMapItemDTO =>
  ({
    id,
    kind: 'hiking',
    source: 'activity',
    title: id,
    latitude: 25,
    longitude: 55,
    path: `/activity/${id}`,
    activityMode: 'hosted',
    catalogPostedAt: postedAt,
  }) as ExploreMapItemDTO;

describe('applyGuestExploreMapCatalogCap', () => {
  it('is enabled in production and off locally unless forced', () => {
    const previousCap = process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    const previousNode = process.env.NODE_ENV;

    process.env.NODE_ENV = 'production';
    delete process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(true);
    process.env.EXPLORE_MAP_GUEST_CATALOG_CAP = '0';
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(false);

    process.env.NODE_ENV = 'development';
    delete process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(false);
    process.env.EXPLORE_MAP_GUEST_CATALOG_CAP = '1';
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(true);

    if (previousCap === undefined) delete process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    else process.env.EXPLORE_MAP_GUEST_CATALOG_CAP = previousCap;
    if (previousNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNode;
  });

  it('limits guest catalog to 3 oldest-updated places and 3 oldest-posted events', () => {
    const items = [
      ...['2024-06-01', '2024-01-01', '2024-03-01', '2024-02-01', '2024-05-01'].map((at, i) =>
        place(`p${i}`, `${at}T00:00:00.000Z`)
      ),
      ...['2024-06-01', '2024-01-01', '2024-03-01', '2024-02-01', '2024-05-01'].map((at, i) =>
        event(`e${i}`, `${at}T00:00:00.000Z`)
      ),
    ];
    const capped = applyGuestExploreMapCatalogCap(items);
    expect(capped.filter((item) => item.source === 'venue')).toHaveLength(GUEST_EXPLORE_MAP_MAX_PLACES);
    expect(capped.filter((item) => item.source === 'activity')).toHaveLength(GUEST_EXPLORE_MAP_MAX_EVENTS);
    expect(capped).toHaveLength(GUEST_EXPLORE_MAP_MAX_PLACES + GUEST_EXPLORE_MAP_MAX_EVENTS);
    expect(capped.map((item) => item.id).sort()).toEqual(['e1', 'e2', 'e3', 'p1', 'p2', 'p3'].sort());
  });

  it('returns the same guest preview set on repeated calls (stable anti-scrape)', () => {
    const items = [
      ...Array.from({ length: 8 }, (_, i) => place(`p${i}`, `2024-0${(i % 9) + 1}-01T00:00:00.000Z`)),
      ...Array.from({ length: 8 }, (_, i) => event(`e${i}`, `2024-0${(i % 9) + 1}-15T00:00:00.000Z`)),
    ];
    const first = applyGuestExploreMapCatalogCap(items).map((item) => item.id).sort();
    const second = applyGuestExploreMapCatalogCap(items).map((item) => item.id).sort();
    expect(second).toEqual(first);
  });

  it('does not pass through uncategorized map rows', () => {
    const odd = {
      id: 'demand:x',
      kind: 'hiking',
      source: 'participant_intent',
      title: 'Looking',
      latitude: 25,
      longitude: 55,
      path: '/activity/x',
    } as ExploreMapItemDTO;
    const capped = applyGuestExploreMapCatalogCap([odd, ...Array.from({ length: 5 }, (_, i) => event(`e${i}`, '2024-01-01T00:00:00.000Z'))]);
    expect(capped.some((item) => item.id === 'demand:x')).toBe(false);
    expect(capped).toHaveLength(GUEST_EXPLORE_MAP_MAX_EVENTS);
  });

  it('compareGuestPreviewEvents and compareGuestPreviewPlaces sort oldest first', () => {
    expect(compareGuestPreviewEvents(event('b', '2024-02-01T00:00:00.000Z'), event('a', '2024-01-01T00:00:00.000Z'))).toBeGreaterThan(0);
    expect(compareGuestPreviewPlaces(place('b', '2024-02-01T00:00:00.000Z'), place('a', '2024-01-01T00:00:00.000Z'))).toBeGreaterThan(0);
  });
});
