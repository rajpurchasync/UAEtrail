import { describe, expect, it } from 'vitest';
import {
  buildCatalogLocationTags,
  locationHasCatalogAdminEditedTag,
  mapCatalogEntryToLocationCreateInput,
  overlayCatalogDefaultsOnLocation,
  withCatalogAdminEditedTag,
} from '../src/lib/venue-catalog.js';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import type { Location } from '../src/domain/types.js';

describe('venue-catalog', () => {
  it('maps a hiking entry to an active registry location', () => {
    const seed = mapCatalogEntryToLocationCreateInput({
      id: 'wadi-shawka-dam-trail',
      name: 'Wadi Shawka Dam Trail',
      nameAr: 'مسار سد وادي شوكة',
      activityType: 'hiking',
      region: 'RAK',
      latitude: 25.335,
      longitude: 56.115,
    });

    expect(seed).toMatchObject({
      name: 'Wadi Shawka Dam Trail',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      registryListed: true,
      externalSource: 'catalog',
      externalId: 'wadi-shawka-dam-trail',
    });
    expect(seed.images?.length).toBeGreaterThan(0);
    expect(seed.distance).toBeGreaterThan(0);
    expect(seed.areaId).toBeTruthy();
    expect(buildCatalogLocationTags({
      id: 'wadi-al-abadilah',
      name: 'Wadi Shawka Dam Trail',
      nameAr: 'وادي العبادلة',
      activityType: 'hiking',
      region: 'Fujairah',
      latitude: 25.452,
      longitude: 56.351,
    })).toContain('catalog-import');
  });

  it('marks admin-edited catalog venues', () => {
    const tags = withCatalogAdminEditedTag(['catalog-import', 'hiking']);
    expect(locationHasCatalogAdminEditedTag(tags)).toBe(true);
  });

  it('overlays sparse stored rows from catalog JSON on read', () => {
    const sparse: Location = {
      id: 'jebel-jais-base-camp',
      name: 'Jebel Jais Viewing Deck Camp',
      region: 'RAK',
      activityType: ActivityType.CAMPING,
      status: LocationStatus.ACTIVE,
      latitude: 25.943,
      longitude: 56.245,
      tags: ['catalog-import', 'camping', 'catalog:jebel-jais-base-camp'],
      externalSource: 'catalog',
      externalId: 'jebel-jais-base-camp',
    };
    const merged = overlayCatalogDefaultsOnLocation(sparse);
    expect(merged.areaId).toBeTruthy();
    expect(merged.campingType).toBe('self-guided');
    expect(merged.surfaceType).toContain('sand');
    expect(merged.images?.length).toBeGreaterThan(0);
    expect(merged.parkingLat).toBe(25.943);
  });
});
