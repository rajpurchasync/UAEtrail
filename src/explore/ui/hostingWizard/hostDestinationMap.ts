import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import type { CountryCode } from '../../../config/regions';
import { MAP_CONFIG } from '../../../config/platform';
import {
  HOSTING_DESTINATION_MAP_SEARCH_PLACEHOLDER,
  HOSTING_DESTINATION_SELECT_ON_MAP_HINT,
} from '../../createFlowCopy';
import { COMPOSE_MAP_INTENTS, type ComposeMapIntent } from '../../create/interactions';
import {
  searchPlaceCatalogDestination,
  type PlaceCatalogDestinationSearchHit,
} from '../../../places/placeCatalogDestinationIndex';
import { hostingDestinationSearchHitGroupLabel } from '../hostingDestinationDraft';
import type { CreateActivityDraft } from '../hostingFlowEngine';

export const isHostDestinationCatalogMap = (intent: ComposeMapIntent | null): boolean =>
  intent === COMPOSE_MAP_INTENTS.hostDestinationCatalog;

export const isHostDestinationCustomMap = (intent: ComposeMapIntent | null): boolean =>
  intent === COMPOSE_MAP_INTENTS.hostCustomSpot;

export const isHostDestinationMap = (intent: ComposeMapIntent | null): boolean =>
  isHostDestinationCatalogMap(intent) || isHostDestinationCustomMap(intent);

/** Catalog search map centers on the listed leaf (or UAE default) — never going-from coords. */
export const hostDestinationMapCenter = (
  intent: ComposeMapIntent | null,
  draft: CreateActivityDraft,
  selectedPlace?: Pick<PlaceDTO, 'latitude' | 'longitude'> | null
): { lat: number; lng: number } => {
  const fallback = MAP_CONFIG.exploreDefaultCenter;
  if (isHostDestinationCustomMap(intent)) {
    return {
      lat: draft.trailLatitude ?? fallback.lat,
      lng: draft.trailLongitude ?? fallback.lng,
    };
  }
  if (isHostDestinationCatalogMap(intent)) {
    return {
      lat: selectedPlace?.latitude ?? draft.trailLatitude ?? fallback.lat,
      lng: selectedPlace?.longitude ?? draft.trailLongitude ?? fallback.lng,
    };
  }
  return fallback;
};

/** Listed and new-spot maps both write destination pin coords — never going-from. */
export const applyHostDestinationMapLocation = (
  intent: ComposeMapIntent | null,
  latitude: number,
  longitude: number
): Partial<CreateActivityDraft> | null => {
  if (!isHostDestinationMap(intent)) return null;
  return { trailLatitude: latitude, trailLongitude: longitude };
};

export const hostDestinationCatalogSearch = ({
  catalogPlaces,
  areas,
  countryCode,
  state,
  areaId,
  onPickHit,
}: {
  catalogPlaces: PlaceDTO[];
  areas: AreaPublicDTO[];
  countryCode: CountryCode;
  state?: string;
  areaId?: string | null;
  onPickHit: (hit: PlaceCatalogDestinationSearchHit) => void;
}) => ({
  placeholder: HOSTING_DESTINATION_MAP_SEARCH_PLACEHOLDER,
  hint: HOSTING_DESTINATION_SELECT_ON_MAP_HINT,
  resolveHits: (query: string) =>
    searchPlaceCatalogDestination(query, catalogPlaces, areas, countryCode, {
      state: state || undefined,
      areaId: areaId || undefined,
    }),
  groupLabel: hostingDestinationSearchHitGroupLabel,
  onPickHit,
});
