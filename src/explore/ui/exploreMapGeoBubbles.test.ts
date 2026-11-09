import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GeoStore } from '../../geo/geoStore';
import type { GeoTreeDTO } from '@uaetrail/shared-types';
import {
  EXPLORE_GEO_BUBBLE_PIN_MIN_ZOOM,
  buildGeoBubbleHtml,
  exploreGeoBubblesForZoom,
  geoBubbleKindForZoom,
} from './exploreMapGeoBubbles';

const tree = (): GeoTreeDTO => ({
  version: 1,
  nodes: [
    {
      id: 'c1',
      p: null,
      l: 1,
      s: 'ae',
      n: 'United Arab Emirates',
      c: [54.5, 24.4],
      path: 'ae',
      kind: 'country',
      iso: 'AE',
    },
    {
      id: 's1',
      p: 'c1',
      l: 2,
      s: 'dubai',
      n: 'Dubai',
      c: [55.3, 25.2],
      path: 'ae/dubai',
      kind: 'state',
    },
    {
      id: 'a1',
      p: 's1',
      l: 3,
      s: 'hatta',
      n: 'Hatta',
      c: [56.1, 24.8],
      path: 'ae/dubai/hatta',
      kind: 'area',
    },
  ],
});

describe('explore map geo zoom bubbles', () => {
  it('uses country / state / area bands then pins', () => {
    expect(geoBubbleKindForZoom(5)).toBe('country');
    expect(geoBubbleKindForZoom(6)).toBe('country');
    expect(geoBubbleKindForZoom(7)).toBe('state');
    expect(geoBubbleKindForZoom(8)).toBe('area');
    expect(geoBubbleKindForZoom(EXPLORE_GEO_BUBBLE_PIN_MIN_ZOOM)).toBeNull();
    expect(geoBubbleKindForZoom(11)).toBeNull();
  });

  it('selects child-count bubbles from the in-memory geo tree', () => {
    const store = new GeoStore();
    store.load(tree());
    const countries = exploreGeoBubblesForZoom(store, 6);
    expect(countries).toHaveLength(1);
    expect(countries[0]?.count).toBe(2);
    expect(countries[0]?.name).toBe('United Arab Emirates');

    const states = exploreGeoBubblesForZoom(store, 7);
    expect(states.map((b) => b.name)).toEqual(['Dubai']);
    expect(states[0]?.count).toBe(1);

    const areas = exploreGeoBubblesForZoom(store, 8);
    expect(areas.map((b) => b.name)).toEqual(['Hatta']);
    expect(exploreGeoBubblesForZoom(store, 9)).toEqual([]);
  });

  it('builds a labeled circle without extra map vendors', () => {
    const { html } = buildGeoBubbleHtml('Dubai', 12);
    expect(html).toContain('uaetrail-map-cluster');
    expect(html).toContain('12');
    expect(html).toContain('Dubai');
    const source = readFileSync(join(process.cwd(), 'src/explore/ui/exploreMapGeoBubbles.ts'), 'utf8');
    expect(source).not.toMatch(/from ['"]leaflet['"]|mapbox/i);
  });
});
