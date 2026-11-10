import { describe, expect, it } from 'vitest';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import { applyHostingDestinationSearchHit } from '../explore/ui/hostingDestinationDraft';
import {
  buildPlaceCatalogAreaOptions,
  buildPlaceCatalogPlaceGroupOptions,
  buildPlaceCatalogStateOptions,
  filterPlaceCatalogTrailRowsInGroup,
  inferPlaceCatalogLadderFromRow,
  placeCatalogRegionsMatch,
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

    expect(buildPlaceCatalogStateOptions('AE').map((row) => row.value)).toContain('Dubai');
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
    const placeHits = searchPlaceCatalogDestination('wadi shawka', places, areas, 'AE');
    const group = placeHits.find((row) => row.kind === 'place');
    expect(group?.kind).toBe('place');
    if (group?.kind === 'place') {
      const patch = applyHostingDestinationSearchHit(group, areas, 'AE');
      expect(patch?.venueCascadePlaceGroup).toBe('Wadi Shawka');
    }
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
});
