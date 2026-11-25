import { describe, expect, it } from 'vitest';
import { Accessibility, ActivityType } from '../src/domain/enums.js';
import { locationSubmitBodySchema } from '../src/domain/location-submit.js';
import { buildLocationCreateData } from '../src/services/location-submit.js';
import { buildTestLocationSubmitBody, testAreas } from './helpers/test-seed.js';

describe('buildLocationCreateData', () => {
  it('persists areaLabel and syncs area tag for outdoor venues', () => {
    const data = buildLocationCreateData(
      buildTestLocationSubmitBody({
        name: 'Wadi Shawka Loop',
        region: 'RAK',
        destinationId: testAreas.hatta.id,
        areaLabel: 'Wadi Shawka Dam',
        difficulty: 'moderate',
        accessibleBy: ['car'],
        childFriendly: true,
      }),
      'user-1'
    );

    expect(data.destinationId).toBe(testAreas.hatta.id);
    expect(data.areaLabel).toBe('Wadi Shawka Dam');
    expect(data.childFriendly).toBe(true);
    expect(data.tags).toContain('area:Wadi Shawka Dam');
    expect(data.accessibility).toBe(Accessibility.CAR_ACCESSIBLE);
    expect(data.submittedBy).toEqual({ connect: { id: 'user-1' } });
  });

  it('derives remote accessibility from 4x4-only access', () => {
    const data = buildLocationCreateData(
      buildTestLocationSubmitBody({
        name: 'Desert Camp',
        region: 'Abu Dhabi',
        activityType: 'camping',
        accessibleBy: ['4x4'],
        surfaceType: ['sand'],
      }),
      'user-2'
    );

    expect(data.accessibility).toBe(Accessibility.REMOTE);
  });

  it('persists facility kind tags on member facility submit', () => {
    const data = buildLocationCreateData(
      buildTestLocationSubmitBody({
        name: 'Dam toilets',
        region: 'Dubai',
        activityType: 'event',
        facilityKind: 'toilet',
        destinationId: testAreas.hatta.id,
      }),
      'user-facility'
    );

    expect(data.activityType).toBe(ActivityType.EVENT);
    expect(data.tags).toContain('place-kind:toilet');
    expect(data.status).toBe('DRAFT');
  });
});

describe('locationSubmitBodySchema outdoor photos', () => {
  it('requires a country code instead of assuming UAE', () => {
    const { countryCode: _countryCode, ...body } = buildTestLocationSubmitBody();
    expect(locationSubmitBodySchema.safeParse(body).success).toBe(false);
  });

  it('requires at least one photo for a trail', () => {
    const parsed = locationSubmitBodySchema.safeParse(
      buildTestLocationSubmitBody({ images: [] })
    );
    expect(parsed.success).toBe(false);
  });

  it('accepts one photo for a trail', () => {
    const parsed = locationSubmitBodySchema.safeParse(
      buildTestLocationSubmitBody({ images: ['https://example.com/one.jpg'] })
    );
    expect(parsed.success).toBe(true);
  });

  it('accepts a proposed area name instead of a published area id', () => {
    const parsed = locationSubmitBodySchema.safeParse(
      buildTestLocationSubmitBody({
        destinationId: undefined,
        proposedAreaName: 'Wadi Naqab',
        latitude: 25.7,
        longitude: 56.1,
      })
    );
    expect(parsed.success).toBe(true);
  });

  it('allows a single photo on activity-anchor pins', () => {
    const parsed = locationSubmitBodySchema.safeParse(
      buildTestLocationSubmitBody({
        activityAnchor: true,
        images: ['https://example.com/one.jpg'],
      })
    );
    expect(parsed.success).toBe(true);
  });
});
