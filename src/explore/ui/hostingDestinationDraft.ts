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
import {
  HOSTING_DESTINATION_SEARCH_GROUP_AREA,
  HOSTING_DESTINATION_SEARCH_GROUP_PLACE,
  HOSTING_DESTINATION_SEARCH_GROUP_ROUTE,
} from '../createFlowCopy';
import type { CreateActivityDraft } from './hostingFlowEngine';
import { applyRegistryPlaceToHostingDraft } from './hostingPlaceRegistryDraft';
import { fetchPublishedAreas } from '../../hooks/areaHubClientApi';
import { resolvePublishedAreaIdForPoint } from '../hostingPublishArea';

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

/** Catalogue miss — typed trail + emirate + area + pin. Keeps any State/Area already chosen. */
export const patchHostingDestinationEnterCustom = (
  draft: Pick<
    CreateActivityDraft,
    'venueCascadeState' | 'registryPlaceAreaId' | 'customPlaceAreaId' | 'customPlaceEmirate'
  >
): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'custom',
  registryPlaceId: null,
  venueCascadePlaceGroup: '',
  customPlaceAreaId: draft.registryPlaceAreaId ?? draft.customPlaceAreaId,
  customPlaceEmirate: draft.customPlaceEmirate.trim() || draft.venueCascadeState,
  trailName: '',
  trailLatitude: null,
  trailLongitude: null,
  meetingLatitude: null,
  meetingLongitude: null,
  meetingPointLabel: '',
});

export const patchHostingDestinationBackToListed = (): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'registry',
  trailName: '',
  customPlaceImages: [],
  customPlaceProposedAreaName: '',
  trailLatitude: null,
  trailLongitude: null,
  registryPlaceId: null,
  venueCascadePlaceGroup: '',
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
/** Full draft patch when a host picks a catalog leaf (dropdown, search, or map search). */
export const patchPickHostingCatalogPlace = (
  draft: CreateActivityDraft,
  placeId: string,
  catalogPlaces: PlaceDTO[],
  areas: AreaPublicDTO[],
  countryCode: CountryCode = DEFAULT_PLACE_CATALOG_COUNTRY
): Partial<CreateActivityDraft> => {
  const place = catalogPlaces.find((item) => item.id === placeId);
  if (!place) {
    return {
      registryPlaceId: placeId,
      placeLabelSource: 'registry',
    };
  }
  const ladder = patchHostingDestinationCatalogLeafLadder(place, areas, countryCode, catalogPlaces);
  const basePatch = applyRegistryPlaceToHostingDraft(draft, place);
  return {
    ...ladder,
    ...basePatch,
    registryPlaceAreaId:
      basePatch.registryPlaceAreaId ?? ladder.registryPlaceAreaId ?? draft.registryPlaceAreaId,
  };
};

/** Optional `registryPlaceAreaId` when the leaf row lacks a persisted area but has coordinates. */
export const hostingDestinationSearchHitGroupLabel = (
  hit: PlaceCatalogDestinationSearchHit
): string => {
  if (hit.kind === 'trail') return HOSTING_DESTINATION_SEARCH_GROUP_ROUTE;
  if (hit.kind === 'place') return HOSTING_DESTINATION_SEARCH_GROUP_PLACE;
  return HOSTING_DESTINATION_SEARCH_GROUP_AREA;
};

export const enrichHostingCatalogPlacePick = async (
  place: PlaceDTO,
  patch: Partial<CreateActivityDraft>
): Promise<Partial<CreateActivityDraft> | null> => {
  if (patch.registryPlaceAreaId) return null;
  const lat = place.latitude;
  const lng = place.longitude;
  if (lat == null || lng == null) return null;
  const published = await fetchPublishedAreas();
  const inferredAreaId = resolvePublishedAreaIdForPoint(lat, lng, published);
  return inferredAreaId ? { registryPlaceAreaId: inferredAreaId } : null;
};

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
