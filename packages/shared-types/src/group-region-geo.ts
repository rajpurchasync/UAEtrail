import {
  approximateAreaBoundsKm2,
  pointInAreaBounds,
  type AreaBoundsRing,
  type AreaDTO,
} from './area.js';
import {
  buildGroupRegionLevels,
  type GroupRegionLevels,
} from './group-region.js';

/** UAE catalog values for `groupRegion` today (explore filter keys in `src/config/regions.ts`). */
export type UaeGroupRegionCatalogLabel =
  | 'Dubai'
  | 'Abu Dhabi'
  | 'Al Ain'
  | 'Sharjah'
  | 'RAK'
  | 'Fujairah'
  | 'Ajman'
  | 'Umm Al Quwain';

type GroupRegionGeoZone = {
  label: UaeGroupRegionCatalogLabel;
  bounds: AreaBoundsRing;
  priority: number;
};

const ringFromBBox = (
  south: number,
  west: number,
  north: number,
  east: number
): AreaBoundsRing => [
  { latitude: south, longitude: west },
  { latitude: south, longitude: east },
  { latitude: north, longitude: east },
  { latitude: north, longitude: west },
];

/** UAE state envelopes — fallback when curated area polygons miss the pin. */
const UAE_GROUP_REGION_GEO_ZONES: GroupRegionGeoZone[] = [
  { label: 'Umm Al Quwain', priority: 10, bounds: ringFromBBox(25.48, 55.48, 25.62, 55.72) },
  { label: 'Ajman', priority: 11, bounds: ringFromBBox(25.32, 55.43, 25.48, 55.58) },
  { label: 'Al Ain', priority: 12, bounds: ringFromBBox(24.0, 55.6, 24.55, 56.25) },
  { label: 'Sharjah', priority: 14, bounds: ringFromBBox(25.28, 56.28, 25.42, 56.38) },
  { label: 'Dubai', priority: 15, bounds: ringFromBBox(24.76, 56.05, 24.92, 56.28) },
  { label: 'Dubai', priority: 20, bounds: ringFromBBox(24.74, 54.95, 25.36, 55.65) },
  { label: 'Sharjah', priority: 21, bounds: ringFromBBox(25.15, 55.45, 25.55, 55.85) },
  { label: 'Fujairah', priority: 22, bounds: ringFromBBox(24.95, 56.15, 25.65, 56.38) },
  { label: 'RAK', priority: 23, bounds: ringFromBBox(25.45, 55.75, 26.0, 56.15) },
  { label: 'Abu Dhabi', priority: 90, bounds: ringFromBBox(22.63, 51.0, 24.85, 55.75) },
];

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const TEXT_TO_UAE_GROUP_REGION: ReadonlyArray<{
  tokens: string[];
  label: UaeGroupRegionCatalogLabel;
}> = [
  { tokens: ['dubai'], label: 'Dubai' },
  { tokens: ['abu dhabi', 'abudhabi'], label: 'Abu Dhabi' },
  { tokens: ['al ain', 'alain'], label: 'Al Ain' },
  { tokens: ['sharjah', 'kalba', 'khor fakkan', 'khorfakkan'], label: 'Sharjah' },
  { tokens: ['rak', 'ras al khaimah', 'ras al khaima', 'rask al khaimah'], label: 'RAK' },
  { tokens: ['fujairah', 'dibba', 'masafi'], label: 'Fujairah' },
  { tokens: ['ajman'], label: 'Ajman' },
  { tokens: ['umm al quwain', 'uaq'], label: 'Umm Al Quwain' },
];

/** Normalize stored `groupRegion` or free-text region to a UAE catalog label. */
export const normalizeGroupRegionLabel = (
  raw: string | null | undefined
): UaeGroupRegionCatalogLabel | null => {
  if (!raw?.trim()) return null;
  const token = normalizeToken(raw);
  for (const entry of TEXT_TO_UAE_GROUP_REGION) {
    if (entry.tokens.some((candidate) => token === candidate || token.includes(candidate))) {
      return entry.label;
    }
  }
  return null;
};

const resolveFromPublishedAreas = (
  latitude: number,
  longitude: number,
  publishedAreas: Pick<AreaDTO, 'id' | 'region' | 'bounds' | 'priority'>[],
  placeAreaId?: string | null
): UaeGroupRegionCatalogLabel | null => {
  if (placeAreaId?.trim()) {
    const linked = publishedAreas.find((area) => area.id === placeAreaId.trim());
    const fromLinked = normalizeGroupRegionLabel(linked?.region ?? null);
    if (fromLinked) return fromLinked;
  }

  const hits = publishedAreas.filter((area) => pointInAreaBounds(latitude, longitude, area.bounds));
  if (hits.length === 0) return null;

  hits.sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds);
  });

  return normalizeGroupRegionLabel(hits[0].region);
};

const resolveFromStaticZones = (
  latitude: number,
  longitude: number
): UaeGroupRegionCatalogLabel | null => {
  const hits = UAE_GROUP_REGION_GEO_ZONES.filter((zone) =>
    pointInAreaBounds(latitude, longitude, zone.bounds)
  );
  if (hits.length === 0) return null;

  hits.sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds);
  });

  return hits[0].label;
};

export const resolveGroupRegionFromCoordinates = (
  latitude: number,
  longitude: number,
  options?: {
    placeAreaId?: string | null;
    publishedAreas?: Pick<AreaDTO, 'id' | 'region' | 'bounds' | 'priority'>[];
  }
): UaeGroupRegionCatalogLabel | null => {
  const fromAreas = options?.publishedAreas?.length
    ? resolveFromPublishedAreas(latitude, longitude, options.publishedAreas, options.placeAreaId)
    : null;
  if (fromAreas) return fromAreas;
  return resolveFromStaticZones(latitude, longitude);
};

export type GroupRegionResolutionInput = {
  /** Level-2 hint (e.g. emirate picked in a form). */
  stateHint?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  areaId?: string | null;
  publishedAreas?: Pick<AreaDTO, 'id' | 'region' | 'bounds' | 'priority'>[];
};

/** Resolve UAE level-2 (state/emirate) label from hint, locality, or coordinates. */
export const resolveGroupRegionLabel = (
  input: GroupRegionResolutionInput
): UaeGroupRegionCatalogLabel | null => {
  const fromHint = normalizeGroupRegionLabel(input.stateHint);
  if (fromHint) return fromHint;

  const fromRegion = normalizeGroupRegionLabel(input.region);
  if (fromRegion) return fromRegion;

  const latitude = input.latitude;
  const longitude = input.longitude;
  if (latitude == null || longitude == null) return null;

  return resolveGroupRegionFromCoordinates(latitude, longitude, {
    placeAreaId: input.areaId,
    publishedAreas: input.publishedAreas,
  });
};

export type StampGroupRegionLevelsGeoInput = GroupRegionResolutionInput & {
  countryCode: string;
  areaLabel?: string | null;
  existing?: GroupRegionLevels | null;
};

/** Build full L1–L4 payload for persistence (UAE resolver for L2 today). */
export const stampGroupRegionLevelsFromGeo = (
  input: StampGroupRegionLevelsGeoInput
): GroupRegionLevels =>
  buildGroupRegionLevels({
    countryCode: input.countryCode,
    region: input.region,
    areaLabel: input.areaLabel,
    existing: input.existing,
    stateHint: input.stateHint,
    resolvedState: resolveGroupRegionLabel(input),
    normalizeState: (raw) => normalizeGroupRegionLabel(raw),
  });
