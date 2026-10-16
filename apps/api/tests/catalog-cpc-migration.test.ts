import { beforeAll, describe, expect, it } from 'vitest';
import { ActivityType, LocationStatus } from '../src/domain/enums.js';
import { catalogLifecycleFromLocationRow } from '../src/lib/catalog-lifecycle-map.js';
import {
  backfillFacilitiesFromLocations,
  reconcileCatalogCpcMigration,
  runCatalogCpcMigrations,
} from '../src/lib/catalog-cpc-migrations.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';

beforeAll(async () => {
  configureTestEnv();
  await bootstrapTestApp();
});

describe('catalogLifecycleFromLocationRow', () => {
  it('maps registry anchor rows to anchor_only publication', () => {
    expect(
      catalogLifecycleFromLocationRow({ status: LocationStatus.ACTIVE, registryListed: false })
    ).toEqual({ moderationStatus: 'approved', publicationStatus: 'anchor_only' });
  });

  it('maps draft rows to pending + unlisted', () => {
    expect(catalogLifecycleFromLocationRow({ status: LocationStatus.DRAFT, registryListed: true })).toEqual({
      moderationStatus: 'pending',
      publicationStatus: 'unlisted',
    });
  });
});

describe('catalog CPC migrations', () => {
  it('backfills facility rows from locations and is idempotent', async () => {
    const db = getMongoClient()!.db();
    const suffix = `cpc-${Date.now()}`;

    await createLocationRecord({
      name: `Rest stop ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.EVENT,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.1,
      longitude: 55.2,
      countryCode: 'AE',
      images: ['https://example.com/facility.jpg'],
      tags: ['place-kind:rest_area'],
      registryListed: true,
      areaId: 'area-test-dubai',
      description: 'Shaded rest area with benches for hikers in the UAE outdoors.',
    });

    const shop = await createLocationRecord({
      name: `Gear pin ${suffix}`,
      region: 'Dubai',
      activityType: ActivityType.SHOP,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.11,
      longitude: 55.21,
      countryCode: 'AE',
      images: ['https://example.com/shop.jpg'],
      tags: ['community-shop'],
      registryListed: true,
      areaId: 'area-test-dubai',
      description: 'Community outdoor gear pin contributed by a member on the map.',
    });

    await runCatalogCpcMigrations(db);
    const facilities = db.collection(COLLECTIONS.FACILITIES);
    const restDoc = await facilities.findOne({ facilityKind: 'rest_area', name: `Rest stop ${suffix}` });
    expect(restDoc).toBeTruthy();
    expect(restDoc?.moderationStatus).toBe('approved');
    expect(restDoc?.publicationStatus).toBe('listed');

    const shopFacility = await facilities.findOne({ _id: shop.id });
    expect(shopFacility?.facilityKind).toBe('outdoor_shop');

    const before = await facilities.countDocuments({});
    await backfillFacilitiesFromLocations(db);
    const after = await facilities.countDocuments({});
    expect(after).toBe(before);

    const reconciliation = await reconcileCatalogCpcMigration(db);
    expect(reconciliation.outdoorShopFacilities).toBeGreaterThanOrEqual(1);
    expect(reconciliation.facilitiesCollectionCount).toBeGreaterThanOrEqual(reconciliation.communityShopRows);
  });
});
