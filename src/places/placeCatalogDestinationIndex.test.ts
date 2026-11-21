import { describe, expect, it } from 'vitest';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import {
  applyHostingDestinationSearchHit,
  patchHostingDestinationCatalogLeafLadder,
  patchHostingDestinationCountryChange,
  patchHostingDestinationEnterCustom,
  patchPickHostingCatalogPlace,
} from '../explore/ui/hostingDestinationDraft';
import { emptyCreateActivityDraft } from '../explore/ui/hostingFlowEngine';
import {
  buildPlaceCatalogAreaOptions,
  buildPlaceCatalogPlaceGroupOptions,
  buildPlaceCatalogStateOptions,
  collectPlaceCatalogParentHubIds,
  filterPlaceCatalogTrailRowsInGroup,
  placeCatalogRowIsHostingLeaf,
  inferPlaceCatalogLadderFromRow,
  placeCatalogPlaceGroupKey,
  placeCatalogPlaceGroupLabelForKey,
  placeCatalogRegionsMatch,
  nearestPlaceCatalogHostingLeaf,
  searchPlaceCatalogDestination,
  scopePlaceCatalogDestination,
} from './placeCatalogDestinationIndex';

const area = (partial: Partial<AreaPublicDTO> & Pick<AreaPublicDTO, 'id' | 'name' | 'region'>): AreaPublicDTO => ({
  slug: partial.slug ?? partial.id,
  center: { latitude: 25, longitude: 55 },
  bounds: [
    { latitude: 24, longitude: 54 },
    { latitude: 26, longitude: 54 },
    { latitude: 26, longitude: 56 },
    { latitude: 24, longitude: 56 },
  ],
  priority: 1,
  ...partial,
});

const place = (partial: Partial<PlaceDTO> & Pick<PlaceDTO, 'id' | 'name' | 'region'>): PlaceDTO => ({
  activityType: 'hiking',
  description: 'Desc',
  season: [],
  childFriendly: false,
  images: [],
  featured: false,
  status: 'active',
  ...partial,
});

/** Place hub grouping + catalog leaves only — facilities use `facilities` + `parentPlaceId`, not this index. */
describe('placeCatalogDestinationIndex', () => {
  it('matches emirate aliases (RAK vs Ras Al Khaimah)', () => {
    expect(placeCatalogRegionsMatch('RAK', 'Ras Al Khaimah')).toBe(true);
    expect(placeCatalogRegionsMatch('Dubai', 'Sharjah')).toBe(false);
  });

  it('groups leaf rows by parentPlaceId when set', () => {
    const hubId = 'hub-wadi';
    const places = [
      place({
        id: 'leaf-1',
        name: 'Loop A',
        region: 'Dubai',
        areaId: 'a-hatta',
        parentPlaceId: hubId,
        areaLabel: 'ignored when parent set',
      }),
      place({
        id: hubId,
        name: 'Wadi Shawka',
        region: 'Dubai',
        areaId: 'a-hatta',
        areaLabel: 'Wadi Shawka',
      }),
    ];
    expect(placeCatalogPlaceGroupKey(places[0])).toBe(hubId);
    expect(placeCatalogPlaceGroupLabelForKey(places, hubId)).toBe('Wadi Shawka');
    const parentHubIds = collectPlaceCatalogParentHubIds(places);
    expect(placeCatalogPlaceGroupKey(places[1], parentHubIds)).toBe(hubId);
    expect(placeCatalogRowIsHostingLeaf(places[1], parentHubIds)).toBe(false);
    expect(placeCatalogRowIsHostingLeaf(places[0], parentHubIds)).toBe(true);
    expect(filterPlaceCatalogTrailRowsInGroup(places, hubId, places).map((row) => row.id)).toEqual([
      'leaf-1',
    ]);
  });

  it('builds state → area → place group → trail options from catalog rows', () => {
    const areas = [
      area({ id: 'a-hatta', name: 'Hatta', region: 'Dubai' }),
      area({ id: 'a-jais', name: 'Jebel Jais', region: 'RAK' }),
    ];
    const places = [
      place({
        id: 't-1',
        name: 'Hatta Dam loop',
        region: 'Dubai',
        areaId: 'a-hatta',
        areaLabel: 'Hatta Dam visitor park',
      }),
      place({
        id: 't-2',
        name: 'Hatta hike B',
        region: 'Dubai',
        areaId: 'a-hatta',
        areaLabel: 'Hatta Dam visitor park',
      }),
      place({ id: 't-3', name: 'Jais summit', region: 'RAK', areaId: 'a-jais', areaLabel: 'Summit trail' }),
    ];

    expect(buildPlaceCatalogStateOptions('AE', areas).map((row) => row.value)).toContain('Dubai');
    const dubaiAreas = buildPlaceCatalogAreaOptions(places, areas, 'Dubai');
    expect(dubaiAreas.map((row) => row.id)).toEqual(['a-hatta']);

    const inHatta = places.filter((row) => row.areaId === 'a-hatta');
    expect(buildPlaceCatalogPlaceGroupOptions(inHatta)).toEqual([
      { key: 'Hatta Dam visitor park', label: 'Hatta Dam visitor park' },
    ]);
    expect(filterPlaceCatalogTrailRowsInGroup(inHatta, 'Hatta Dam visitor park').map((row) => row.id)).toEqual([
      't-1',
      't-2',
    ]);
  });

  it('snaps a map pin to the nearest hosting leaf', () => {
    const places = [
      place({
        id: 'near',
        name: 'Near loop',
        region: 'Dubai',
        latitude: 25.0,
        longitude: 55.0,
      }),
      place({
        id: 'far',
        name: 'Far loop',
        region: 'Dubai',
        latitude: 26.0,
        longitude: 56.0,
      }),
    ];
    expect(nearestPlaceCatalogHostingLeaf(25.001, 55.001, places)?.id).toBe('near');
    expect(nearestPlaceCatalogHostingLeaf(24.0, 54.0, places)).toBeNull();
  });

  it('scopes catalog to country (default AE)', () => {
    const areas = [
      area({ id: 'a-uae', name: 'Hatta', region: 'Dubai', countryCode: 'AE' }),
      area({ id: 'a-om', name: 'Jebel Shams', region: 'Ad Dakhiliyah', countryCode: 'OM' }),
    ];
    const places = [
      place({ id: 'uae-1', name: 'UAE trail', region: 'Dubai', areaId: 'a-uae', countryCode: 'AE' }),
      place({ id: 'om-1', name: 'Oman trail', region: 'Ad Dakhiliyah', areaId: 'a-om', countryCode: 'OM' }),
    ];
    const scoped = scopePlaceCatalogDestination(places, areas, 'AE');
    expect(scoped.places.map((row) => row.id)).toEqual(['uae-1']);
  });

  it('search and apply hits share ladder keys', () => {
    const areas = [area({ id: 'a-hatta', name: 'Hatta', region: 'Dubai' })];
    const places = [
      place({
        id: 't-loop',
        name: 'Wadi Shawka loop',
        region: 'Dubai',
        areaId: 'a-hatta',
        areaLabel: 'Wadi Shawka',
      }),
      place({
        id: 't-short',
        name: 'Wadi Shawka short route',
        region: 'Dubai',
        areaId: 'a-hatta',
        areaLabel: 'Wadi Shawka',
      }),
    ];
    const trailHits = searchPlaceCatalogDestination('loop', places, areas, 'AE');
    expect(trailHits.find((row) => row.kind === 'trail')?.placeId).toBe('t-loop');
    expect(
      searchPlaceCatalogDestination('loop', places, areas, 'AE', { state: 'Dubai' }).find(
        (row) => row.kind === 'trail'
      )?.placeId
    ).toBe('t-loop');
    expect(
      searchPlaceCatalogDestination('loop', places, areas, 'AE', { state: 'RAK' }).filter(
        (row) => row.kind === 'trail'
      )
    ).toEqual([]);
    const placeHits = searchPlaceCatalogDestination('wadi shawka', places, areas, 'AE');
    const group = placeHits.find((row) => row.kind === 'place');
    expect(group?.kind).toBe('place');
    if (group?.kind === 'place') {
      const patch = applyHostingDestinationSearchHit(group, areas, 'AE');
      expect(patch?.venueCascadePlaceGroup).toBe('Wadi Shawka');
    }
  });

  it('patchHostingDestinationCountryChange resets ladder and sets country', () => {
    expect(patchHostingDestinationCountryChange('OM')).toMatchObject({
      customPlaceCountry: 'OM',
      venueCascadeState: '',
      venueCascadePlaceGroup: '',
      registryPlaceAreaId: null,
      registryPlaceId: null,
    });
  });

  it('patchHostingDestinationCatalogLeafLadder maps infer result to draft fields', () => {
    const areas = [area({ id: 'a-1', name: 'Hatta', region: 'Dubai' })];
    const row = place({
      id: 'p-1',
      name: 'Dam loop',
      region: 'Dubai',
      areaId: 'a-1',
      areaLabel: 'Hatta Dam',
    });
    expect(patchHostingDestinationCatalogLeafLadder(row, areas, 'AE')).toEqual({
      venueCascadeState: 'Dubai',
      registryPlaceAreaId: 'a-1',
      venueCascadePlaceGroup: 'Hatta Dam',
    });
  });

  it('infers ladder from a catalog row', () => {
    const areas = [area({ id: 'a-1', name: 'Hatta', region: 'Dubai' })];
    const row = place({
      id: 'p-1',
      name: 'Dam loop',
      region: 'Dubai',
      areaId: 'a-1',
      areaLabel: 'Hatta Dam',
    });
    expect(inferPlaceCatalogLadderFromRow(row, areas, 'AE')).toEqual({
      state: 'Dubai',
      areaId: 'a-1',
      placeGroup: 'Hatta Dam',
    });
  });

  it('patchPickHostingCatalogPlace fills emirate, area, place, and trail in one pick', () => {
    const areas = [area({ id: 'a-1', name: 'Hatta', region: 'Dubai' })];
    const row = place({
      id: 'p-1',
      name: 'Dam loop',
      region: 'Dubai',
      areaId: 'a-1',
      areaLabel: 'Hatta Dam',
      latitude: 24.8,
      longitude: 56.1,
    });
    expect(patchPickHostingCatalogPlace(emptyCreateActivityDraft(), 'p-1', [row], areas, 'AE')).toMatchObject(
      {
        venueCascadeState: 'Dubai',
        registryPlaceAreaId: 'a-1',
        venueCascadePlaceGroup: 'Hatta Dam',
        registryPlaceId: 'p-1',
        placeLabelSource: 'registry',
        trailName: 'Dam loop',
      }
    );
  });

  it('enter custom keeps selected emirate and area', () => {
    expect(
      patchHostingDestinationEnterCustom({
        venueCascadeState: 'Dubai',
        registryPlaceAreaId: 'a-hatta',
        customPlaceAreaId: null,
        customPlaceEmirate: '',
      })
    ).toMatchObject({
      placeLabelSource: 'custom',
      registryPlaceId: null,
      venueCascadePlaceGroup: '',
      customPlaceAreaId: 'a-hatta',
      customPlaceEmirate: 'Dubai',
      trailName: '',
    });
  });
});
