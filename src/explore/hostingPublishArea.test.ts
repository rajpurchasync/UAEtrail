import { describe, expect, it } from 'vitest';
import { emptySeekingDraft } from './ui/seekingFlowEngine';
import { emptyCreateActivityDraft } from './ui/hostingFlowEngine';
import { curatedAreaSeedId, type PlaceDTO } from '@uaetrail/shared-types';
import {
  seekingPostVisibleOnMap,
  validateSeekingPublishArea,
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

  it('blocks custom venue labels for public map', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'custom' as const,
    };
    expect(validateHostingPlaceArea(draft, [])).toMatch(/catalog place/);
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
    expect(validateHostingPublishArea(draft)).toMatch(/catalog place/);
  });
});

describe('validateSeekingPublishArea', () => {
  it('requires area and pin on curated step', () => {
    const draft = {
      ...emptySeekingDraft(),
      kind: 'hiking' as const,
      areaId: HATTA_AREA_ID,
      areaPinPlaced: false,
    };
    expect(validateSeekingPublishArea(draft, 'hiking')).toMatch(/pin on the map/);
  });

  it('passes when area and pin are set', () => {
    const draft = {
      ...emptySeekingDraft(),
      kind: 'hiking' as const,
      areaId: HATTA_AREA_ID,
      areaPinPlaced: true,
      latitude: 25,
      longitude: 55,
    };
    expect(seekingPostVisibleOnMap(draft)).toBe(true);
    expect(validateSeekingPublishArea(draft, 'hiking')).toBeNull();
  });
});
