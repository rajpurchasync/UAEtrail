import {
  approximateAreaBoundsKm2,
  inferEmirateFromLocalityName,
  pointInAreaBounds,
  resolveGroupRegionFromCoordinates,
  type AreaPublicDTO,
  type PlaceDTO,
  type UaeGroupRegionCatalogLabel,
} from '@uaetrail/shared-types';
import type { SeekingDraft, SeekingKind } from './ui/seekingFlowEngine';
import type { CreateActivityDraft } from './ui/hostingFlowEngine';

const PLACE_AREA_REQUIRED =
  'Choose a listed trail, or add a new one with a name, area, and map pin.';

const placeAreaError = (place: PlaceDTO | null | undefined, registryPlaceId: string | null): string => {
  if (place?.name?.trim()) {
    return `“${place.name.trim()}” isn’t linked to a map area yet. Pick another listed trail, or add a new one with a name, area, and map pin.`;
  }
  if (registryPlaceId?.trim()) {
    return 'We couldn’t verify that venue — open the destination step and select your trail again from the catalog list.';
  }
  return PLACE_AREA_REQUIRED;
};
const SEEKING_AREA_REQUIRED = 'Choose an area you want company in.';

const RIDESHARE_DESTINATION_REQUIRED =
  'Choose an outing meeting point or an approved catalog place as your ride destination.';

/** Community / pro rideshare destination — not the hike/camp `registryPlaceId` path. */
export const validateRideshareDestinationArea = (
  draft: CreateActivityDraft,
  registryPlaces: PlaceDTO[] = []
): string | null => {
  if (draft.kind !== 'rideshare') return null;

  const destKind = draft.rideshareDestinationKind;
  if (destKind === 'activity_meeting') {
    return draft.rideshareDestinationActivityId?.trim() ? null : RIDESHARE_DESTINATION_REQUIRED;
  }
  if (destKind === 'pending_place') {
    return draft.rideshareDestinationPlaceId?.trim() ? null : RIDESHARE_DESTINATION_REQUIRED;
  }
  if (destKind === 'catalog_place') {
    const placeId = draft.rideshareDestinationPlaceId?.trim();
    if (!placeId) return RIDESHARE_DESTINATION_REQUIRED;
    const place = registryPlaces.find((row) => row.id === placeId);
    if (place?.areaId?.trim()) return null;
    if (!place) return null;
    return placeAreaError(place, placeId);
  }
  if (destKind === 'map') {
    return draft.toLatitude != null && draft.toLongitude != null
      ? null
      : 'Drop a destination pin on the map.';
  }
  return RIDESHARE_DESTINATION_REQUIRED;
};

/** Public organize publish — area lives on the catalog **place**, not the activity row. */
export const validateHostingPlaceArea = (
  draft: CreateActivityDraft,
  registryPlaces: PlaceDTO[]
): string | null => {
  if (draft.joinMode === 'private') return null;
  if (draft.kind === 'rideshare') {
    return validateRideshareDestinationArea(draft, registryPlaces);
  }
  if (draft.placeLabelSource === 'custom') {
    return validateCustomVenueDetails(draft);
  }
  if (draft.registryPlaceAreaId?.trim()) return null;

  const place = draft.registryPlaceId
    ? registryPlaces.find((row) => row.id === draft.registryPlaceId)
    : null;
  if (place?.areaId?.trim()) return null;
  return placeAreaError(place, draft.registryPlaceId);
};

/** Match search/Home emirate pills from a pin (published area polygons, then UAE envelopes). */
export const inferEmirateFromPin = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  areas: Pick<AreaPublicDTO, 'id' | 'region' | 'bounds' | 'priority'>[] = [],
  localityName?: string | null
): UaeGroupRegionCatalogLabel | null => {
  const fromGeo =
    latitude != null && longitude != null
      ? resolveGroupRegionFromCoordinates(latitude, longitude, { publishedAreas: areas })
      : null;
  return fromGeo || inferEmirateFromLocalityName(localityName);
};

export const resolveRequiredEmirate = (
  explicit: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  areas: Pick<AreaPublicDTO, 'id' | 'region' | 'bounds' | 'priority'>[] = [],
  localityName?: string | null
): string =>
  explicit?.trim() || inferEmirateFromPin(latitude, longitude, areas, localityName) || '';

/** New spot name doubles as the new area name when the pin is outside listed hubs. */
export const resolveCustomProposedAreaName = (draft: CreateActivityDraft): string =>
  draft.customPlaceProposedAreaName.trim() || draft.trailName.trim();

const EMIRATE_REQUIRED =
  'Choose the emirate (Dubai, Ras Al Khaimah, Sharjah, …). Search and Home use this filter.';

/** New (non-registry) trail/camp/venue — submitted as a DRAFT place for admin review. */
export const validateCustomVenueDetails = (draft: CreateActivityDraft): string | null => {
  if (!draft.trailName.trim()) {
    if (draft.kind === 'camping') return 'Name the camp or area.';
    if (draft.kind === 'event') return 'Name the venue or area.';
    return 'Name the trail or where you are going.';
  }
  if (draft.trailLatitude == null || draft.trailLongitude == null) {
    return 'Pin the spot on the map.';
  }
  const emirate =
    draft.customPlaceEmirate?.trim() ||
    draft.venueCascadeState?.trim() ||
    inferEmirateFromPin(
      draft.trailLatitude,
      draft.trailLongitude,
      [],
      `${draft.trailName} ${draft.customPlaceProposedAreaName}`
    ) ||
    '';
  if (!emirate) return EMIRATE_REQUIRED;
  if (!draft.customPlaceAreaId?.trim() && !draft.registryPlaceAreaId?.trim()) {
    return 'Select an area.';
  }
  return null;
};

/** @deprecated Use validateHostingPlaceArea — kept for import stability during migration. */
export const validateHostingPublishArea = (draft: CreateActivityDraft): string | null => {
  if (draft.joinMode === 'private') return null;
  if (draft.kind === 'rideshare') {
    return validateRideshareDestinationArea(draft);
  }
  if (draft.placeLabelSource === 'custom') {
    return validateCustomVenueDetails(draft);
  }
  if (!draft.registryPlaceId?.trim()) return PLACE_AREA_REQUIRED;
  return null;
};

export const validateSeekingCuratedAreaStep = (draft: SeekingDraft): string | null => {
  if (!draft.areaId?.trim()) return SEEKING_AREA_REQUIRED;
  return null;
};

/** Find posts appear on the map from the going-from pin (rideshare also has a to pin). */
export const seekingPostVisibleOnMap = (draft: SeekingDraft): boolean =>
  Boolean(draft.fromPinPlaced && draft.areaId?.trim() && draft.latitude != null && draft.longitude != null);

export const validateSeekingPublishArea = (draft: SeekingDraft, kind: SeekingKind | null): string | null => {
  if (!kind) return null;
  if (!usesSeekingCuratedAreaStep(kind)) return null;
  return validateSeekingCuratedAreaStep(draft);
};

export const usesSeekingCuratedAreaStep = (kind: SeekingKind): boolean =>
  kind === 'hiking' ||
  kind === 'camping' ||
  kind === 'rideshare' ||
  kind === 'event' ||
  kind === 'guide' ||
  kind === 'other';

export const resolveRegistryPlaceAreaId = (place: PlaceDTO | null | undefined): string | null =>
  place?.areaId?.trim() ? place.areaId.trim() : null;

/** Ephemeral activity-anchor places only (e.g. rideshare) — not for hosted trail/camp catalog tagging. */
export const resolvePublishedAreaForPoint = (
  latitude: number,
  longitude: number,
  areas: AreaPublicDTO[]
): AreaPublicDTO | null => {
  const hits = areas.filter((area) => pointInAreaBounds(latitude, longitude, area.bounds));
  if (hits.length === 0) return null;
  hits.sort(
    (a, b) => approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds)
  );
  return hits[0] ?? null;
};

export const resolvePublishedAreaIdForPoint = (
  latitude: number,
  longitude: number,
  areas: AreaPublicDTO[]
): string | null => resolvePublishedAreaForPoint(latitude, longitude, areas)?.id ?? null;

export const areaLabelForId = (
  areaId: string | null | undefined,
  areas: AreaPublicDTO[]
): string | null => {
  if (!areaId?.trim()) return null;
  const row = areas.find((area) => area.id === areaId);
  return row?.name ?? null;
};
