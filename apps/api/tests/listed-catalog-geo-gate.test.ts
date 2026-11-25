import { describe, expect, it } from 'vitest';
import { LocationStatus } from '../src/domain/enums.js';
import type { Location } from '../src/domain/types.js';
import { ApiError } from '../src/lib/api-error.js';
import {
  assertActiveListedFacilityHasCatalogGeo,
  assertActiveListedPlaceHasCatalogGeo,
} from '../src/lib/listed-catalog-geo-gate.js';
import type { Facility } from '../src/domain/facility.js';
import { testAreas } from './helpers/test-seed.js';

const baseLocation = (): Location =>
  ({
    id: 'loc-1',
    name: 'Trail',
    region: 'Dubai',
    placeHubLabel: null,
    destinationId: testAreas.hatta.id,
    activityType: 'hiking',
    description: '',
    difficulty: null,
    season: [],
    childFriendly: false,
    maxGroupSize: null,
    accessibility: null,
    images: [],
    featured: false,
    status: LocationStatus.ACTIVE,
    distance: null,
    duration: null,
    elevation: null,
    campingType: null,
    latitude: 25.0,
    longitude: 55.0,
    highlights: [],
    surfaceType: [],
    tags: [],
    parkingLink: null,
    parkingLat: null,
    parkingLng: null,
    groupRegionLevels: null,
    geoRef: {
      chain: ['c', 's'],
      countryId: 'c',
      stateId: 's',
      areaId: 'a',
      path: 'ae/dubai',
      names: { country: 'AE', state: 'Dubai', area: 'Dubai' },
      searchTokens: ['ae', 'dubai'],
    },
    premiumImages: [],
    accessibleBy: [],
    viewCount: 0,
    countryCode: 'AE',
    gpxKey: null,
    guidePdfKey: null,
    guideMarkdown: null,
    guidePreview: null,
    unlockPriceAed: 0,
    submittedById: null,
    registryListed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Location;

describe('assertActiveListedPlaceHasCatalogGeo', () => {
  it('passes when active listed row has coords, geoRef, and destination', () => {
    expect(() => assertActiveListedPlaceHasCatalogGeo(baseLocation())).not.toThrow();
  });

  it('rejects missing geoRef on listed activate', () => {
    const row = { ...baseLocation(), geoRef: null };
    expect(() => assertActiveListedPlaceHasCatalogGeo(row)).toThrow(ApiError);
    try {
      assertActiveListedPlaceHasCatalogGeo(row);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('place_georef_required');
    }
  });

  it('skips draft rows', () => {
    const row = { ...baseLocation(), status: LocationStatus.DRAFT, geoRef: null };
    expect(() => assertActiveListedPlaceHasCatalogGeo(row)).not.toThrow();
  });
});

const baseFacility = (): Facility =>
  ({
    id: 'fac-1',
    name: 'Toilet',
    region: 'Dubai',
    placeHubLabel: null,
    destinationId: testAreas.hatta.id,
    facilityKind: 'toilet',
    description: '',
    latitude: 25.0,
    longitude: 55.0,
    images: [],
    tags: [],
    status: LocationStatus.ACTIVE,
    moderationStatus: 'approved',
    publicationStatus: 'published',
    registeredByUserId: 'u1',
    countryCode: 'AE',
    geoRef: baseLocation().geoRef,
    featured: false,
    registryListed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Facility;

describe('assertActiveListedFacilityHasCatalogGeo', () => {
  it('passes when active listed facility has coords, geoRef, and destination', () => {
    expect(() => assertActiveListedFacilityHasCatalogGeo(baseFacility())).not.toThrow();
  });

  it('rejects missing destination on listed activate', () => {
    const row = { ...baseFacility(), destinationId: null };
    expect(() => assertActiveListedFacilityHasCatalogGeo(row)).toThrow(ApiError);
    try {
      assertActiveListedFacilityHasCatalogGeo(row);
    } catch (error) {
      expect((error as ApiError).code).toBe('facility_destination_required');
    }
  });
});