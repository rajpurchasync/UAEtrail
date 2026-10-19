import {
  approximateAreaBoundsKm2,
  pointInAreaBounds,
  type AreaPublicDTO,
  type PlaceDTO,
} from '@uaetrail/shared-types';
import type { SeekingDraft, SeekingKind } from './ui/seekingFlowEngine';
import type { CreateActivityDraft } from './ui/hostingFlowEngine';

const PLACE_AREA_REQUIRED =
  'Choose a catalog place linked to an area (admin links places in the registry), or add the spot via Add first.';
const SEEKING_AREA_REQUIRED = 'Choose an area and drop a pin on the map.';
const SEEKING_AREA_PIN_REQUIRED = 'Drop a pin on the map for the area you selected.';

/** Public organize publish — area lives on the catalog **place**, not the activity row. */
export const validateHostingPlaceArea = (
  draft: CreateActivityDraft,
  registryPlaces: PlaceDTO[]
): string | null => {
  if (draft.joinMode === 'private') return null;
  if (draft.placeLabelSource === 'custom') {
    return 'Publish from a catalog place with an area, or add your spot via Add (select an area first).';
  }
  const place = draft.registryPlaceId
    ? registryPlaces.find((row) => row.id === draft.registryPlaceId)
    : null;
  if (!place?.areaId?.trim()) return PLACE_AREA_REQUIRED;
  return null;
};

/** @deprecated Use validateHostingPlaceArea — kept for import stability during migration. */
export const validateHostingPublishArea = (draft: CreateActivityDraft): string | null => {
  if (draft.joinMode === 'private') return null;
  if (!draft.registryPlaceId?.trim()) return PLACE_AREA_REQUIRED;
  return null;
};

export const validateSeekingCuratedAreaStep = (draft: SeekingDraft): string | null => {
  if (!draft.areaId?.trim()) return SEEKING_AREA_REQUIRED;
  if (!draft.areaPinPlaced || draft.latitude == null || draft.longitude == null) {
    return SEEKING_AREA_PIN_REQUIRED;
  }
  return null;
};

/** Find posts with a map pin need area + pin on the curated-area step. */
export const seekingPostVisibleOnMap = (draft: SeekingDraft): boolean =>
  Boolean(draft.areaPinPlaced && draft.areaId?.trim());

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
export const resolvePublishedAreaIdForPoint = (
  latitude: number,
  longitude: number,
  areas: AreaPublicDTO[]
): string | null => {
  const hits = areas.filter((area) => pointInAreaBounds(latitude, longitude, area.bounds));
  if (hits.length === 0) return null;
  hits.sort(
    (a, b) => approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds)
  );
  return hits[0]?.id ?? null;
};

export const areaLabelForId = (
  areaId: string | null | undefined,
  areas: AreaPublicDTO[]
): string | null => {
  if (!areaId?.trim()) return null;
  const row = areas.find((area) => area.id === areaId);
  return row?.name ?? null;
};
