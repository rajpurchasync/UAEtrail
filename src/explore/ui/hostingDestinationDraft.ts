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
import { fetchPublishedDestinations } from '../../hooks/areaHubClientApi';
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
  registryPlaceDestinationId: null,
  venueCascadePlaceGroup: '',
  ...patchHostingDestinationClearTrailSlot(),
});

export const patchHostingDestinationAreaChange = (destinationId: string): Partial<CreateActivityDraft> => ({
  registryPlaceDestinationId: destinationId.trim() ? destinationId : null,
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
  registryPlaceDestinationId: null,
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
    'venueCascadeState' | 'registryPlaceDestinationId' | 'customPlaceDestinationId' | 'customPlaceEmirate'
  >
): Partial<CreateActivityDraft> => ({
  placeLabelSource: 'custom',
  registryPlaceId: null,
  venueCascadePlaceGroup: '',
  customPlaceDestinationId: draft.registryPlaceDestinationId ?? draft.customPlaceDestinationId,
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
    registryPlaceDestinationId: ladder.destinationId,
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
    registryPlaceDestinationId:
      basePatch.registryPlaceDestinationId ?? ladder.registryPlaceDestinationId ?? draft.registryPlaceDestinationId,
  };
};

/** Optional `registryPlaceDestinationId` when the leaf row lacks a persisted area but has coordinates. */
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
  if (patch.registryPlaceDestinationId) return null;
  const lat = place.latitude;
  const lng = place.longitude;
  if (lat == null || lng == null) return null;
  const published = await fetchPublishedDestinations();
  const inferredAreaId = resolvePublishedAreaIdForPoint(lat, lng, published);
  return inferredAreaId ? { registryPlaceDestinationId: inferredAreaId } : null;
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
      registryPlaceDestinationId: hit.destinationId,
      venueCascadePlaceGroup: hit.placeGroupKey,
      ...patchHostingDestinationClearTrailSlot(),
    };
  }
  const area = areas.find((row) => row.id === hit.destinationId);
  const state = area ? resolvePlaceCatalogStateFromArea(area, countryCode, areas) : '';
  return {
    venueCascadeState: state,
    registryPlaceDestinationId: hit.destinationId,
    venueCascadePlaceGroup: '',
    ...patchHostingDestinationClearTrailSlot(),
  };
};
