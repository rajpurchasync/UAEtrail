import { describe, expect, it } from 'vitest';
import { emptyDemandDraft } from './ui/demandFlow';
import { emptyCreateActivityDraft } from './ui/organizeFlow';
import { curatedAreaSeedId, type PlaceDTO } from '@uaetrail/shared-types';
import {
  demandPostVisibleOnMap,
  validateDemandPublishArea,
  validateOrganizePlaceArea,
  validateOrganizePublishArea,
} from './organizePublishArea';

const HATTA_AREA_ID = curatedAreaSeedId('hatta');

const placeWithArea = (id: string): PlaceDTO =>
  ({
    id,
    name: 'Trail',
    areaId: HATTA_AREA_ID,
    activityType: 'hiking',
    region: 'Dubai',
  }) as PlaceDTO;

describe('validateOrganizePlaceArea', () => {
  it('requires registry place with area for public outings', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'registry' as const,
      registryPlaceId: 'loc-1',
    };
    expect(validateOrganizePlaceArea(draft, [placeWithArea('loc-1')])).toBeNull();
    expect(validateOrganizePlaceArea(draft, [{ ...placeWithArea('loc-1'), areaId: null }])).toMatch(
      /catalog place/
    );
  });

  it('blocks custom venue labels for public map', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      kind: 'hiking' as const,
      joinMode: 'open' as const,
      placeLabelSource: 'custom' as const,
    };
    expect(validateOrganizePlaceArea(draft, [])).toMatch(/catalog place/);
  });

  it('skips for private link-only outings', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, joinMode: 'private' as const };
    expect(validateOrganizePlaceArea(draft, [])).toBeNull();
  });
});

describe('validateOrganizePublishArea (legacy shim)', () => {
  it('requires registry place id for public outings', () => {
    const draft = { ...emptyCreateActivityDraft(), kind: 'hiking' as const, joinMode: 'open' as const };
    expect(validateOrganizePublishArea(draft)).toMatch(/catalog place/);
  });
});

describe('validateDemandPublishArea', () => {
  it('requires area and pin on curated step', () => {
    const draft = {
      ...emptyDemandDraft(),
      kind: 'hiking' as const,
      areaId: HATTA_AREA_ID,
      areaPinPlaced: false,
    };
    expect(validateDemandPublishArea(draft, 'hiking')).toMatch(/pin on the map/);
  });

  it('passes when area and pin are set', () => {
    const draft = {
      ...emptyDemandDraft(),
      kind: 'hiking' as const,
      areaId: HATTA_AREA_ID,
      areaPinPlaced: true,
      latitude: 25,
      longitude: 55,
    };
    expect(demandPostVisibleOnMap(draft)).toBe(true);
    expect(validateDemandPublishArea(draft, 'hiking')).toBeNull();
  });
});
