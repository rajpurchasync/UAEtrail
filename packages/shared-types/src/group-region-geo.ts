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

const bboxZone = (
  label: UaeGroupRegionCatalogLabel,
  priority: number,
  south: number,
  west: number,
  north: number,
  east: number
): GroupRegionGeoZone => ({
  label,
  priority,
  bounds: ringFromBBox(south, west, north, east),
});

/**
 * Dubai / Sharjah / Ajman / RAK interlock (Masfut, Hatta, Manama, Kalba, Khor Fakkan).
 * Match these first — even before a fat published “Hatta” polygon — so Masfut is not Dubai.
 */
const UAE_GROUP_REGION_EXCLAVES: GroupRegionGeoZone[] = [
  bboxZone('Ajman', 1, 24.785, 55.975, 24.855, 56.072), // Masfut (Ajman), west of Hatta
  bboxZone('Dubai', 2, 24.755, 56.085, 24.875, 56.22), // Hatta town / dam / Wadi Hub
  bboxZone('Ajman', 3, 25.3, 55.975, 25.355, 56.075), // Manama (Ajman inland)
  bboxZone('RAK', 4, 25.08, 55.98, 25.22, 56.14), // Wadi Shawka / Sfai
  bboxZone('RAK', 5, 25.28, 56.04, 25.44, 56.22), // Shawka–Jais foothills
  bboxZone('Sharjah', 6, 24.88, 56.12, 25.05, 56.28), // Wadi Al Helo (Sharjah), north of Hatta
  bboxZone('Sharjah', 7, 24.99, 56.29, 25.095, 56.42), // Kalba
  bboxZone('Sharjah', 8, 25.3, 56.3, 25.42, 56.42), // Khor Fakkan
  bboxZone('Sharjah', 9, 25.605, 56.255, 25.635, 56.285), // Dibba Al-Hisn
  bboxZone('Sharjah', 10, 24.93, 55.72, 25.06, 55.9), // Al Madam
];

/**
 * Emirate cores. Coastal Dubai stops south of Al Nahda; Sharjah/Ajman are split so
 * the ~1 km border strip is unmatched and the host must pick the filter.
 */
const UAE_GROUP_REGION_CORES: GroupRegionGeoZone[] = [
  bboxZone('Ajman', 11, 25.388, 55.42, 25.46, 55.58),
  bboxZone('Umm Al Quwain', 12, 25.48, 55.48, 25.62, 55.72),
  bboxZone('Sharjah', 13, 25.288, 55.36, 25.382, 55.55),
  bboxZone('Sharjah', 14, 25.08, 55.7, 25.34, 56.0), // Mleiha / Dhaid
  bboxZone('Al Ain', 15, 24.0, 55.6, 24.55, 56.25),
  bboxZone('Dubai', 20, 24.8, 54.96, 25.276, 55.42),
  bboxZone('Dubai', 21, 24.78, 55.38, 25.2, 55.7),
  bboxZone('RAK', 23, 25.52, 55.78, 26.08, 56.22),
  bboxZone('Fujairah', 24, 25.1, 56.2, 25.58, 56.38),
  bboxZone('Fujairah', 25, 25.55, 56.2, 25.72, 56.36),
  bboxZone('Abu Dhabi', 90, 22.63, 51.0, 24.82, 55.75),
];

const UAE_GROUP_REGION_GEO_ZONES: GroupRegionGeoZone[] = [
  ...UAE_GROUP_REGION_EXCLAVES,
  ...UAE_GROUP_REGION_CORES,
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
  { tokens: ['dibba al hisn', 'dibba al-hisn'], label: 'Sharjah' },
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

/**
 * Place / wadi names that are not emirate keys — used when the pin sits between boxes.
 * Do not fold these through {@link normalizeGroupRegionLabel} (that would wipe L3 locality).
 */
const LOCALITY_TO_UAE_GROUP_REGION: ReadonlyArray<{
  tokens: string[];
  label: UaeGroupRegionCatalogLabel;
}> = [
  { tokens: ['wadi al helo', 'wadi al-helo', 'wadi helo', 'al helo'], label: 'Sharjah' },
  { tokens: ['wadi shees', 'shees'], label: 'Sharjah' },
  { tokens: ['masfut', 'masfoot'], label: 'Ajman' },
  { tokens: ['hatta'], label: 'Dubai' },
  { tokens: ['shawka'], label: 'RAK' },
  { tokens: ['mleiha', 'maleha'], label: 'Sharjah' },
  { tokens: ['kalba'], label: 'Sharjah' },
  { tokens: ['khor fakkan', 'khorfakkan'], label: 'Sharjah' },
];

/** Infer emirate from a trail / area name when coordinates are ambiguous. */
export const inferEmirateFromLocalityName = (
  raw: string | null | undefined
): UaeGroupRegionCatalogLabel | null => {
  if (!raw?.trim()) return null;
  const token = normalizeToken(raw);
  let best: { label: UaeGroupRegionCatalogLabel; length: number } | null = null;
  for (const entry of LOCALITY_TO_UAE_GROUP_REGION) {
    for (const candidate of entry.tokens) {
      if (token === candidate || token.includes(candidate)) {
        if (!best || candidate.length > best.length) {
          best = { label: entry.label, length: candidate.length };
        }
      }
    }
  }
  return best?.label ?? null;
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

const sortZones = (zones: GroupRegionGeoZone[]): GroupRegionGeoZone[] =>
  [...zones].sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds);
  });

const boundsCenter = (bounds: AreaBoundsRing): { latitude: number; longitude: number } => {
  const latitude = bounds.reduce((sum, point) => sum + point.latitude, 0) / bounds.length;
  const longitude = bounds.reduce((sum, point) => sum + point.longitude, 0) / bounds.length;
  return { latitude, longitude };
};

const matchingStaticZone = (
  latitude: number,
  longitude: number
): GroupRegionGeoZone | null => {
  const hits = UAE_GROUP_REGION_GEO_ZONES.filter((zone) =>
    pointInAreaBounds(latitude, longitude, zone.bounds)
  );
  return sortZones(hits)[0] ?? null;
};

const resolveFromStaticZones = (
  latitude: number,
  longitude: number
): UaeGroupRegionCatalogLabel | null => matchingStaticZone(latitude, longitude)?.label ?? null;

/** Area name plus the zone center — never the device coordinate. */
export type GroupRegionAreaAnchor = {
  label: UaeGroupRegionCatalogLabel;
  latitude: number;
  longitude: number;
};

export const UAE_GROUP_REGION_AREA_LABELS: readonly UaeGroupRegionCatalogLabel[] = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'RAK',
  'Fujairah',
  'Al Ain',
];

/** Match a point to an emirate and return that area’s center, not the point itself. */
export const resolveGroupRegionAreaAnchor = (
  latitude: number,
  longitude: number
): GroupRegionAreaAnchor | null => {
  const zone = matchingStaticZone(latitude, longitude);
  if (!zone) return null;
  return { label: zone.label, ...boundsCenter(zone.bounds) };
};

/** Representative center for an emirate the member picked without sharing a precise point. */
export const groupRegionAnchorForLabel = (
  label: UaeGroupRegionCatalogLabel
): GroupRegionAreaAnchor => {
  const zones = UAE_GROUP_REGION_GEO_ZONES.filter((zone) => zone.label === label);
  const largest = [...zones].sort(
    (a, b) => approximateAreaBoundsKm2(b.bounds) - approximateAreaBoundsKm2(a.bounds)
  )[0];
  if (!largest) throw new Error(`No geo zone for ${label}`);
  return { label, ...boundsCenter(largest.bounds) };
};

const resolveFromExclaves = (
  latitude: number,
  longitude: number
): UaeGroupRegionCatalogLabel | null => {
  const hits = UAE_GROUP_REGION_EXCLAVES.filter((zone) =>
    pointInAreaBounds(latitude, longitude, zone.bounds)
  );
  return sortZones(hits)[0]?.label ?? null;
};

export const resolveGroupRegionFromCoordinates = (
  latitude: number,
  longitude: number,
  options?: {
    placeAreaId?: string | null;
    publishedAreas?: Pick<AreaDTO, 'id' | 'region' | 'bounds' | 'priority'>[];
  }
): UaeGroupRegionCatalogLabel | null => {
  const fromExclave = resolveFromExclaves(latitude, longitude);
  if (fromExclave) return fromExclave;
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
