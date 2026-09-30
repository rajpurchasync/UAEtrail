import { describe, expect, it } from 'vitest';
import { resolveVenueExploreLabels } from '../src/lib/venue-display-names.js';

describe('venue-display-names', () => {
  it('builds explore labels from catalog name tags', () => {
    const labels = resolveVenueExploreLabels(
      'Wadi Al Abadilah',
      ['catalog-import', 'name-en:Wadi Al Abadilah', 'name-ar:وادي العبادلة'],
      'Fujairah'
    );
    expect(labels.title).toBe('Wadi Al Abadilah');
    expect(labels.subtitle).toBe('وادي العبادلة · Fujairah');
  });
});
