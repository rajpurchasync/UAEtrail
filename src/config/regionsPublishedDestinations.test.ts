import { describe, expect, it } from 'vitest';
import { mergeVenueStateFilterOptionsWithDestinations } from './regions';

describe('mergeVenueStateFilterOptionsWithDestinations', () => {
  it('uses published area regions when rows exist (static list only when empty)', () => {
    const fromDb = mergeVenueStateFilterOptionsWithDestinations([
      {
        id: 'a1',
        slug: 'liwa',
        name: 'Liwa',
        region: 'Abu Dhabi',
        center: { latitude: 23.1, longitude: 53.8 },
        bounds: [],
        priority: 1,
      },
    ]);
    expect(fromDb).toEqual([{ key: 'Abu Dhabi', label: 'Abu Dhabi' }]);
    expect(fromDb.some((row) => row.key === 'Dubai')).toBe(false);

    const bootstrap = mergeVenueStateFilterOptionsWithDestinations([]);
    expect(bootstrap.some((row) => row.key === 'Dubai')).toBe(true);
  });
});