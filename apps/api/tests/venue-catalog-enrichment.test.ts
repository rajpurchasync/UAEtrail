import { describe, expect, it } from 'vitest';
import {
  enrichCatalogEntryFields,
  resolveCatalogLocationAreaId,
} from '../src/lib/venue-catalog-enrichment.js';
import { mapCatalogEntryToLocationCreateInput } from '../src/lib/venue-catalog.js';
import { ActivityType } from '../src/domain/enums.js';

describe('venue-catalog-enrichment', () => {
  it('enriches sparse camping rows with facts, image, parking, and curated area', () => {
    const enriched = enrichCatalogEntryFields({
      id: 'mleiha-desert-camp',
      name: 'Mleiha Desert Camp',
      nameAr: 'تخييم مليحة',
      activityType: 'camping',
      region: 'Sharjah',
      latitude: 25.089,
      longitude: 55.806,
      description: 'Desert camps in Mleiha — stargazing.',
    });

    expect(enriched.images?.length).toBeGreaterThan(0);
    expect(enriched.surfaceType).toContain('sand');
    expect(enriched.campingType).toBe('self-guided');
    expect(enriched.maxGroupSize).toBe(12);
    expect(enriched.parkingLat).toBe(25.089);
    expect(enriched.areaId).toBe(resolveCatalogLocationAreaId('mleiha-desert-camp'));
    expect(enriched.areaLabel).toBe('Mleiha dunes');
  });

  it('enriches hiking rows with distance, elevation, and difficulty', () => {
    const seed = mapCatalogEntryToLocationCreateInput({
      id: 'wadi-shawka-dam-trail',
      name: 'Wadi Shawka Dam Trail',
      activityType: 'hiking',
      region: 'RAK',
      latitude: 25.335,
      longitude: 56.115,
    });

    expect(seed.activityType).toBe(ActivityType.HIKING);
    expect(seed.images?.length).toBeGreaterThan(0);
    expect(seed.distance).toBeGreaterThan(0);
    expect(seed.duration).toBeGreaterThan(0);
    expect(seed.elevation).toBeGreaterThan(0);
    expect(seed.difficulty).toBeTruthy();
    expect(seed.areaId).toBeTruthy();
  });
});
