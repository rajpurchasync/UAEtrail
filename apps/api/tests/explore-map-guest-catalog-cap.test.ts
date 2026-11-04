import { describe, expect, it } from 'vitest';
import {
  applyGuestExploreMapCatalogCap,
  GUEST_EXPLORE_MAP_MAX_EVENTS,
  GUEST_EXPLORE_MAP_MAX_PLACES,
  isGuestExploreMapCatalogCapEnabled,
} from '../src/lib/explore-map-guest-catalog-cap.js';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

const place = (id: string): ExploreMapItemDTO =>
  ({
    id,
    kind: 'trail',
    source: 'venue',
    title: id,
    latitude: 25,
    longitude: 55,
    path: `/trail/${id}`,
  }) as ExploreMapItemDTO;

const event = (id: string): ExploreMapItemDTO =>
  ({
    id,
    kind: 'hiking',
    source: 'activity',
    title: id,
    latitude: 25,
    longitude: 55,
    path: `/activity/${id}`,
    activityMode: 'hosted',
  }) as ExploreMapItemDTO;

describe('applyGuestExploreMapCatalogCap', () => {
  it('stays off on the public map unless EXPLORE_MAP_GUEST_CATALOG_CAP=1', () => {
    const previous = process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    delete process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(false);
    process.env.EXPLORE_MAP_GUEST_CATALOG_CAP = '1';
    expect(isGuestExploreMapCatalogCapEnabled()).toBe(true);
    if (previous === undefined) delete process.env.EXPLORE_MAP_GUEST_CATALOG_CAP;
    else process.env.EXPLORE_MAP_GUEST_CATALOG_CAP = previous;
  });

  it('limits guest catalog to 3 places and 3 events', () => {
    const items = [
      ...Array.from({ length: 8 }, (_, i) => place(`p${i}`)),
      ...Array.from({ length: 8 }, (_, i) => event(`e${i}`)),
    ];
    const capped = applyGuestExploreMapCatalogCap(items);
    expect(capped.filter((item) => item.source === 'venue')).toHaveLength(GUEST_EXPLORE_MAP_MAX_PLACES);
    expect(capped.filter((item) => item.source === 'activity')).toHaveLength(GUEST_EXPLORE_MAP_MAX_EVENTS);
    expect(capped).toHaveLength(GUEST_EXPLORE_MAP_MAX_PLACES + GUEST_EXPLORE_MAP_MAX_EVENTS);
  });
});
