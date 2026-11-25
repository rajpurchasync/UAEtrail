/**
 * Demo amenities in `facilities` collection (CPC map + place detail nearby list).
 * Idempotent — safe on every `npm run seed`.
 */
import type { FacilityKind } from '@uaetrail/shared-types';
import { curatedDestinationSeedId } from '@uaetrail/shared-types';
import type { Document } from 'mongodb';
import { ActivityType, Accessibility, Difficulty, LocationStatus } from '../src/domain/enums.js';
import {
  buildLocationFromCreateInput,
  type LocationCreateInput,
} from '../src/lib/entity-builders.js';
import { withCatalogLifecycleFields } from '../src/lib/catalog-lifecycle-map.js';
import { facilitiesCollection } from '../src/lib/facilities-store.js';
import { findLocationInMongo, writeLocationToMongo } from '../src/lib/entity-sync.js';
import { stampLocationGroupRegionLevels } from '../src/lib/group-region-resolution.js';

const SEED_REGISTERED_BY = 'seed-catalog-facilities';

type SeedFacilityRow = {
  id: string;
  name: string;
  facilityKind: FacilityKind;
  parentPlaceId: string;
  destinationId: string;
  placeHubLabel: string;
  region: string;
  description: string;
  latitude: number;
  longitude: number;
  images: string[];
};

const hattaArea = curatedDestinationSeedId('hatta');

/** Minimal catalog rows so facility seed works when full `npm run seed` was skipped. */
const FACILITY_PARENT_PLACE_STUBS: Array<{ id: string; data: LocationCreateInput }> = [
  {
    id: 'hatta-wadi-hub-loop',
    data: {
      name: 'Hatta Wadi Hub Trail',
      region: 'Dubai',
      placeHubLabel: 'Hatta Wadi Hub',
      destinationId: hattaArea,
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.MODERATE,
      accessibility: Accessibility.CAR_ACCESSIBLE,
      description: 'Marked trail from Hatta Wadi Hub through rocky wadi sections.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
      latitude: 24.8195,
      longitude: 56.1285,
      distance: 9,
      duration: 3.5,
      tags: ['hatta', 'wadi', 'seed-stub'],
    },
  },
  {
    id: 'hatta-hill-park-camp',
    data: {
      name: 'Hatta Hill Park Camp',
      region: 'Dubai',
      placeHubLabel: 'Hatta Hill Park',
      destinationId: hattaArea,
      activityType: ActivityType.CAMPING,
      description: 'Terraced hill park with BBQ and overnight camp zones overlooking Hatta.',
      season: ['winter'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
      latitude: 24.8022,
      longitude: 56.1055,
      tags: ['hatta', 'camping', 'seed-stub'],
    },
  },
  {
    id: 'al-qudra-cycling-loop',
    data: {
      name: 'Al Qudra Cycling Loop',
      region: 'Dubai',
      placeHubLabel: 'Al Qudra Lakes',
      destinationId: curatedDestinationSeedId('alQudra'),
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.EASY,
      accessibility: Accessibility.CAR_ACCESSIBLE,
      description: 'Shared cycling and walking loop around Al Qudra lakes.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      latitude: 24.872,
      longitude: 55.52,
      distance: 18,
      tags: ['al qudra', 'seed-stub'],
    },
  },
];

const upsertParentPlaceStub = async (id: string, data: LocationCreateInput): Promise<void> => {
  if (await findLocationInMongo(id)) return;
  let location = buildLocationFromCreateInput(
    { ...data, status: LocationStatus.ACTIVE },
    id
  );
  location = await stampLocationGroupRegionLevels(location);
  await writeLocationToMongo(location);
  console.log(`[seed:catalog-facilities] created parent place stub ${id}`);
};

export const ensureFacilityParentPlaces = async (): Promise<number> => {
  let created = 0;
  for (const stub of FACILITY_PARENT_PLACE_STUBS) {
    const before = await findLocationInMongo(stub.id);
    await upsertParentPlaceStub(stub.id, stub.data);
    if (!before) created += 1;
  }
  return created;
};

const SEED_FACILITIES: SeedFacilityRow[] = [
  {
    id: 'seed-facility-hatta-dam-toilet',
    name: 'Hatta Dam visitor toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'hatta-dam-loop',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Dam visitor park',
    region: 'Dubai',
    description: 'Public toilets and washrooms at the dam visitor car park — handy before the lakeside loop.',
    latitude: 24.7856,
    longitude: 56.1144,
    images: ['https://images.unsplash.com/photo-1646641678252-52aee3025261?w=800'],
  },
  {
    id: 'seed-facility-hatta-dam-water',
    name: 'Hatta Dam drinking water',
    facilityKind: 'water_refill',
    parentPlaceId: 'hatta-dam-loop',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Dam visitor park',
    region: 'Dubai',
    description: 'Refill station near the picnic lawns — bring bottles for the loop.',
    latitude: 24.7852,
    longitude: 56.114,
    images: ['https://images.unsplash.com/photo-1548839140-29a7492991f9?w=800'],
  },
  {
    id: 'seed-facility-hatta-dam-picnic',
    name: 'Hatta Dam picnic lawns',
    facilityKind: 'picnic',
    parentPlaceId: 'hatta-dam-loop',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Dam visitor park',
    region: 'Dubai',
    description: 'Shaded picnic tables overlooking the dam — popular after the hike.',
    latitude: 24.7849,
    longitude: 56.1138,
    images: ['https://images.unsplash.com/photo-1646641678252-52aee3025261?w=800'],
  },
  {
    id: 'seed-facility-hatta-wadi-toilet',
    name: 'Hatta Wadi Hub toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'hatta-wadi-hub-loop',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Wadi Hub',
    region: 'Dubai',
    description: 'Toilets at the adventure hub before the red-white wadi trail.',
    latitude: 24.8196,
    longitude: 56.1289,
    images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
  },
  {
    id: 'seed-facility-hatta-wadi-parking',
    name: 'Hatta Wadi Hub parking',
    facilityKind: 'parking',
    parentPlaceId: 'hatta-wadi-hub-loop',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Wadi Hub',
    region: 'Dubai',
    description: 'Main trailhead parking — arrive early on winter weekends.',
    latitude: 24.8199,
    longitude: 56.1291,
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
  },
  {
    id: 'seed-facility-hatta-hill-toilet',
    name: 'Hatta Hill Park toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'hatta-hill-park-camp',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Hill Park',
    region: 'Dubai',
    description: 'Campground toilets near the terraced BBQ areas.',
    latitude: 24.8024,
    longitude: 56.1056,
    images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
  },
  {
    id: 'seed-facility-hatta-hill-picnic',
    name: 'Hatta Hill Park BBQ terraces',
    facilityKind: 'picnic',
    parentPlaceId: 'hatta-hill-park-camp',
    destinationId: hattaArea,
    placeHubLabel: 'Hatta Hill Park',
    region: 'Dubai',
    description: 'Raised BBQ stands and picnic terraces with sunset views over Hatta.',
    latitude: 24.802,
    longitude: 56.1053,
    images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
  },
  {
    id: 'seed-facility-shawka-dam-toilet',
    name: 'Wadi Shawka dam toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'wadi-shawka-loop',
    destinationId: curatedDestinationSeedId('wadiShawka'),
    placeHubLabel: 'Wadi Shawka Dam',
    region: 'RAK',
    description: 'Toilets at the dam car park — last stop before the wadi loop.',
    latitude: 25.3384,
    longitude: 56.118,
    images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
  },
  {
    id: 'seed-facility-jais-deck-toilet',
    name: 'Jebel Jais viewing deck toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'jebel-jais-summit-trail',
    destinationId: curatedDestinationSeedId('jebelJais'),
    placeHubLabel: 'Jebel Jais Viewing Deck',
    region: 'RAK',
    description: 'Facilities at the viewing deck car park before the summit push.',
    latitude: 25.9436,
    longitude: 56.245,
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
  },
  {
    id: 'seed-facility-jais-rest',
    name: 'Jebel Jais rest shelter',
    facilityKind: 'rest_area',
    parentPlaceId: 'jebel-jais-summit-trail',
    destinationId: curatedDestinationSeedId('jebelJais'),
    placeHubLabel: 'Jebel Jais Viewing Deck',
    region: 'RAK',
    description: 'Sheltered rest stop on the approach — wind break and benches.',
    latitude: 25.948,
    longitude: 56.258,
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
  },
  {
    id: 'seed-facility-qudra-toilet',
    name: 'Al Qudra Lakes toilets',
    facilityKind: 'toilet',
    parentPlaceId: 'al-qudra-cycling-loop',
    destinationId: curatedDestinationSeedId('alQudra'),
    placeHubLabel: 'Al Qudra Lakes',
    region: 'Dubai',
    description: 'Toilets at the main lake car park on the cycling loop.',
    latitude: 24.8712,
    longitude: 55.5185,
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
  },
];

export const seedCatalogFacilities = async (): Promise<{ upserted: number; skipped: number }> => {
  await ensureFacilityParentPlaces();
  const collection = facilitiesCollection();
  let upserted = 0;
  let skipped = 0;

  for (const row of SEED_FACILITIES) {
    const parent = await findLocationInMongo(row.parentPlaceId);
    if (!parent) {
      console.warn(`[seed:catalog-facilities] skip ${row.id} — parent place ${row.parentPlaceId} missing`);
      skipped += 1;
      continue;
    }

    const areaId = parent.areaId?.trim() || row.areaId;
    const now = new Date();
    const lifecycle = withCatalogLifecycleFields({
      status: LocationStatus.ACTIVE,
      registryListed: true,
      submittedById: SEED_REGISTERED_BY,
      registeredByUserId: SEED_REGISTERED_BY,
    });

    const doc = {
      _id: row.id,
      name: row.name,
      region: row.region,
      placeHubLabel: row.placeHubLabel,
      areaId,
      facilityKind: row.facilityKind,
      parentPlaceId: row.parentPlaceId,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      images: row.images,
      tags: ['seed', 'demo', `parent-place:${row.parentPlaceId}`],
      featured: false,
      countryCode: 'AE',
      createdAt: now,
      updatedAt: now,
      ...lifecycle,
      registryListed: true,
      status: LocationStatus.ACTIVE,
    };

    await collection.updateOne({ _id: row.id } as Document, { $set: doc }, { upsert: true });
    upserted += 1;
  }

  return { upserted, skipped };
};
