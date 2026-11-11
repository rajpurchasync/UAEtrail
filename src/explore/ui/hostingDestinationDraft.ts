/**
 * Hosting draft patches for the destination ladder (state → area → place hub → catalog leaf).
 * `registryPlaceId` = chosen leaf row id; `venueCascadePlaceGroup` = place hub bucket key.
 * Facilities are not patched here.
 */
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { CountryCode } from '../../config/regions';
import type { PlaceDTO } from '@uaetrail/shared-types';
import {
  DEFAULT_PLACE_CATALOG_COUNTRY,
  inferPlaceCatalogLadderFromRow,
  resolvePlaceCatalogStateFromArea,
  type PlaceCatalogDestinationSearchHit,
} from '../../places/placeCatalogDestinationIndex';
import type { CreateActivityDraft } from './hostingFlowEngine';

/** Clear trail slot when changing catalog ladder (registry path). */
export const patchHostingDestinationClearTrailSlot = (): Partial<CreateActivityDraft> => ({
  registryPlaceId: null,
  placeLabelSource: 'registry',
  trailName: '',
  trailLatitude: null,
  trailLongitude: null,
  meetingLatitude: null,
  meetingLongitude: null,
  meetingPointLabel: '',
});

export const patchHostingDestinationStateChange = (state: string): Partial<CreateActivityDraft> => ({
  venueCascadeState: state,
  registryPlaceAreaId: null,
  venueCascadePlaceGroup: '',
  ...patchHostingDestinationClearTrailSlot(),
});

export const patchHostingDestinationAreaChange = (areaId: string): Partial<CreateActivityDraft> => ({
  registryPlaceAreaId: areaId.trim() ? areaId : null,
  venueCascadePlaceGroup: '',
  ...patchHostingDestinationClearTrailSlot(),
});

export const patchHostingDestinationPlaceGroupChange = (
  placeGroup: string
): Partial<CreateActivityDraft> => ({
  venueCascadePlaceGroup: placeGroup,
  ...patchHostingDestinationClearTrailSlot(),
});

export const patchHostingDestinationReset = (): Partial<CreateActivityDraft> => ({
  venueCascadeState: '',
  venueCascadePlaceGroup: '',
  registryPlaceAreaId: null,
  ...patchHostingDestinationClearTrailSlot(),
});

/** Switch catalog country — refetch places and clear ladder (keeps `customPlaceCountry`). */
export const patchHostingDestinationCountryChange = (
  countryCode: CountryCode
): Partial<CreateActivityDraft> => ({
  customPlaceCountry: countryCode,
  ...patchHostingDestinationReset(),
});

export const patchHostingDestinationStartCustomTrail = (
  draft: Pick<CreateActivityDraft, 'registryPlaceAreaId' | 'customPlaceAreaId'>
): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'custom',
  registryPlaceId: null,
  customPlaceAreaId: draft.registryPlaceAreaId ?? draft.customPlaceAreaId,
  trailLatitude: null,
  trailLongitude: null,
  meetingLatitude: null,
  meetingLongitude: null,
  meetingPointLabel: '',
});

/** Ladder fields when picking a catalog leaf row (search or trail dropdown). */
export const patchHostingDestinationCatalogLeafLadder = (
  place: PlaceDTO,
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  catalogPlaces?: PlaceDTO[]
): Partial<CreateActivityDraft> => {
  const ladder = inferPlaceCatalogLadderFromRow(place, areas, countryCode, catalogPlaces);
  return {
    venueCascadeState: ladder.state,
    registryPlaceAreaId: ladder.areaId,
    venueCascadePlaceGroup: ladder.placeGroup,
  };
};

/** Map a catalog search hit to hosting draft ladder fields (trail hits use row pick instead). */
export const applyHostingDestinationSearchHit = (
  hit: PlaceCatalogDestinationSearchHit,
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): Partial<CreateActivityDraft> | null => {
  if (hit.kind === 'trail') return null;
  if (hit.kind === 'place') {
    return {
      venueCascadeState: hit.state,
      registryPlaceAreaId: hit.areaId,
      venueCascadePlaceGroup: hit.placeGroupKey,
      ...patchHostingDestinationClearTrailSlot(),
    };
  }
  const area = areas.find((row) => row.id === hit.areaId);
  const state = area ? resolvePlaceCatalogStateFromArea(area, countryCode) : '';
  return {
    venueCascadeState: state,
    registryPlaceAreaId: hit.areaId,
    venueCascadePlaceGroup: '',
    ...patchHostingDestinationClearTrailSlot(),
  };
};
