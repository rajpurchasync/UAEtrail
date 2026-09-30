import { describe, expect, it } from 'vitest';
import {
  buildCatalogLocationTags,
  locationHasCatalogAdminEditedTag,
  mapCatalogEntryToLocationCreateInput,
  withCatalogAdminEditedTag,
} from '../src/lib/venue-catalog.js';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';

describe('venue-catalog', () => {
  it('maps a hiking entry to an active registry location', () => {
    const seed = mapCatalogEntryToLocationCreateInput({
      id: 'wadi-al-abadilah',
      name: 'Wadi Al Abadilah',
      nameAr: 'وادي العبادلة',
      activityType: 'hiking',
      region: 'Fujairah',
      latitude: 25.452,
      longitude: 56.351,
    });

    expect(seed).toMatchObject({
      name: 'Wadi Al Abadilah',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      registryListed: true,
      externalSource: 'catalog',
      externalId: 'wadi-al-abadilah',
    });
    expect(buildCatalogLocationTags({
      id: 'wadi-al-abadilah',
      name: 'Wadi Al Abadilah',
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
});
