import { describe, expect, it } from 'vitest';
import { readVenueAmenityChipLabels } from './venue-catalog-tags';

describe('readVenueAmenityChipLabels', () => {
  it('canonicalizes on-site facility tags and ignores nearby notes', () => {
    expect(
      readVenueAmenityChipLabels([
        'area:Hatta Dam',
        'facility:Toilet at dam car park',
        'facility:fuel',
        'facility:shop',
        'nearby:Fuel & shop ~10 km toward Kalba',
      ])
    ).toEqual(['Toilet', 'Fuel', 'Shop']);
  });

  it('dedupes aliases', () => {
    expect(readVenueAmenityChipLabels(['facility:Toilet', 'facility:restroom at trailhead'])).toEqual([
      'Toilet',
    ]);
  });
});
