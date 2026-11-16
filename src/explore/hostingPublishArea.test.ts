import { describe, expect, it } from 'vitest';
import { emptyAvailabilityFixedDraft } from './ui/availabilityFlowEngine';
import { emptyCreateActivityDraft } from './ui/hostingFlowEngine';
import { curatedAreaSeedId, type PlaceDTO } from '@uaetrail/shared-types';
import {
  inferEmirateFromPin,
  availabilityFixedVisibleOnMap,
  validateAvailabilityPublishArea,
  validateHostingPlaceArea,
  validateHostingPublishArea,
} from './hostingPublishArea';

const HATTA_AREA_ID = curatedAreaSeedId('hatta');

const placeWithArea = (id: string): PlaceDTO =>
  ({
    id,
    name: 'Trail',
    areaId: HATTA_AREA_ID,
    activityType: 'hiking',
    region: 'Dubai',
  }) as PlaceDTO;

describe('validateHostingPlaceArea', () => {
  it('requires registry place with area for public outings', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'registry' as const,
      registryPlaceId: 'loc-1',
    };
    expect(validateHostingPlaceArea(draft, [placeWithArea('loc-1')])).toBeNull();
    expect(validateHostingPlaceArea(draft, [{ ...placeWithArea('loc-1'), areaId: null }])).toMatch(
      /isn’t linked to a map area/
    );
    expect(
      validateHostingPlaceArea(
        { ...draft, registryPlaceAreaId: HATTA_AREA_ID },
        [{ ...placeWithArea('loc-1'), areaId: null }]
      )
    ).toBeNull();
  });

  it('requires name, pin, emirate, and a published area — no photo', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'custom' as const,
      trailName: 'New wadi loop',
    };
    expect(validateHostingPlaceArea(draft, [])).toMatch(/Pin the spot/);
    expect(
      validateHostingPlaceArea(
        {
          ...draft,
          trailLatitude: 24.8,
          trailLongitude: 56.1,
        },
        []
      )
    ).toBe('Select an area.');
    expect(
      validateHostingPlaceArea(
        {
          ...draft,
          customPlaceAreaId: HATTA_AREA_ID,
          trailLatitude: 24.8,
          trailLongitude: 56.1,
        },
        []
      )
    ).toBeNull();
    expect(
      validateHostingPlaceArea(
        {
          ...draft,
          customPlaceProposedAreaName: 'Wadi Naqab',
          trailLatitude: 24.8,
          trailLongitude: 56.1,
        },
        []
      )
    ).toBe('Select an area.');
  });

  it('infers search/Home emirates from the pin and requires a dropdown when unmatched', () => {
    expect(inferEmirateFromPin(24.8, 56.1)).toBe('Dubai');
    expect(inferEmirateFromPin(24.813, 56.052)).toBe('Ajman');
    expect(inferEmirateFromPin(24.978, 56.226)).toBe('Sharjah');
    expect(inferEmirateFromPin(20, 50, [], 'Wadi Al Helo')).toBe('Sharjah');
    expect(inferEmirateFromPin(25.346, 55.421)).toBe('Sharjah');
    expect(inferEmirateFromPin(25.79, 55.94)).toBe('RAK');
    expect(inferEmirateFromPin(20, 50)).toBeNull();
    const unmatched = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'custom' as const,
      trailName: 'Offshore pin',
      trailLatitude: 20,
      trailLongitude: 50,
      customPlaceAreaId: HATTA_AREA_ID,
    };
    expect(validateHostingPlaceArea(unmatched, [])).toMatch(/Choose the emirate/);
    expect(validateHostingPlaceArea({ ...unmatched, customPlaceEmirate: 'Sharjah' }, [])).toBeNull();
    expect(
      validateHostingPlaceArea(
        {
          ...emptyCreateActivityDraft(),
          kind: 'hiking' as const,
          joinMode: 'open' as const,
          placeLabelSource: 'custom' as const,
          trailName: 'Wadi Al Helo',
          trailLatitude: 24.978,
          trailLongitude: 56.226,
          customPlaceAreaId: HATTA_AREA_ID,
        },
        []
      )
    ).toBeNull();
  });

  it('skips for private link-only outings', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, joinMode: 'private' as const };
    expect(validateHostingPlaceArea(draft, [])).toBeNull();
  });

  it('accepts rideshare destination from a linked outing meeting point', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'rideshare' as const,
      joinMode: 'open' as const,
      rideshareDestinationKind: 'activity_meeting' as const,
      rideshareDestinationActivityId: 'act-hike-1',
      toLatitude: 25.1,
      toLongitude: 55.2,
    };
    expect(validateHostingPlaceArea(draft, [])).toBeNull();
    expect(validateHostingPublishArea(draft)).toBeNull();
  });
});

describe('validateHostingPublishArea (legacy shim)', () => {
  it('requires registry place id for public outings', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, joinMode: 'open' as const };
    expect(validateHostingPublishArea(draft)).toMatch(/listed trail/);
  });
});

describe('validateAvailabilityPublishArea', () => {
  it('requires a preferred area on the curated step', () => {
    const draft = {
      ...emptyAvailabilityFixedDraft(),
      kind: 'hiking' as const,
      areaId: null,
    };
    expect(validateAvailabilityPublishArea(draft, 'hiking')).toMatch(/area you want company in/);
  });

  it('passes area without a destination pin; map visibility is going-from', () => {
    const draft = {
      ...emptyAvailabilityFixedDraft(),
      kind: 'hiking' as const,
      areaId: HATTA_AREA_ID,
      fromPinPlaced: true,
      latitude: 25,
      longitude: 55,
    };
    expect(availabilityFixedVisibleOnMap(draft)).toBe(true);
    expect(validateAvailabilityPublishArea(draft, 'hiking')).toBeNull();
  });
});
