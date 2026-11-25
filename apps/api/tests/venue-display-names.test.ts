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

  it('uses area tag as explore subtitle for list poster location facts', () => {
    const labels = resolveVenueExploreLabels(
      'Wadi Shawka Loop',
      ['wadi', 'area:Wadi Shawka Dam'],
      'RAK'
    );
    expect(labels.title).toBe('Wadi Shawka Loop');
    expect(labels.subtitle).toBe('Wadi Shawka Dam');
  });

  it('prefers persisted placeHubLabel over legacy area tag', () => {
    const labels = resolveVenueExploreLabels(
      'Hatta Dam Walk',
      ['area:Old tag'],
      'Dubai',
      'Hatta Dam visitor park'
    );
    expect(labels.subtitle).toBe('Hatta Dam visitor park');
  });
});
