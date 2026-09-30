import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  mapItemMatchesFilterPill,
  parseExploreMapFilterPillsParam,
  toggleExploreMapFilterPill,
} from './exploreBrowseTaxonomy';

const item = (partial: Partial<ExploreMapItemDTO> & Pick<ExploreMapItemDTO, 'id' | 'source' | 'kind'>): ExploreMapItemDTO =>
  ({ title: 't', latitude: 1, longitude: 2, path: '/', ...partial }) as ExploreMapItemDTO;

describe('exploreBrowseTaxonomy', () => {
  it('toggles filter pills', () => {
    expect(toggleExploreMapFilterPill([], 'trips')).toEqual(['trips']);
    expect(toggleExploreMapFilterPill(['trips'], 'trips')).toEqual([]);
  });

  it('maps legacy topic URL values', () => {
    expect(parseExploreMapFilterPillsParam('hiking,camping,shop')).toEqual(['trips', 'shops']);
  });

  it('classifies trips vs spots', () => {
    const trail = item({ id: 'v1', source: 'venue', kind: 'hiking' });
    const hosted = item({ id: 'a1', source: 'activity', kind: 'event' });
    const demand = item({ id: 'd1', source: 'demand', kind: 'hiking' });
    expect(mapItemMatchesFilterPill(trail, 'spots')).toBe(true);
    expect(mapItemMatchesFilterPill(hosted, 'trips')).toBe(true);
    expect(mapItemMatchesFilterPill(demand, 'looking')).toBe(true);
    expect(mapItemMatchesFilterPill(hosted, 'looking')).toBe(false);
  });

});
