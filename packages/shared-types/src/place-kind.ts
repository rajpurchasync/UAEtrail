/**
 * Canonical map / catalog POI model — **one entity (Place)**, many **kinds**.
 *
 * Storage: Mongo `locations` (wire name `Location` / `LocationDTO`).
 * Product name: **Place** — not three concepts (place vs venue vs location).
 *
 * All kinds share one row shape; new kinds (toilet, gas, …) are new `PlaceKind` values,
 * not a separate entity or type tier.
 *
 * Today:
 * - Outdoor catalog rows use legacy field `activityType` (`hiking` | `camping` | `event`).
 * - **Shops** and amenities may use `activityType: event` + `place-kind:<kind>` tags until `placeKind` is persisted.
 */

/** Every catalog / map POI kind — extend this list only; do not add parallel enums. */
export const PLACE_KINDS = [
  'hiking',
  'camping',
  'event',
  /** Parks, beaches, outdoor spots — FAB Add “Others”; wire `activityType: event`. */
  'outdoor_other',
  /** Gear shops on the map — today often tenant-backed; converging on Place rows. */
  'shop',
  'toilet',
  'gas_station',
  'water_refill',
  'parking',
  'viewpoint',
  'picnic',
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

const PLACE_KIND_SET = new Set<string>(PLACE_KINDS);

export const isPlaceKind = (value: string): value is PlaceKind => PLACE_KIND_SET.has(value);

export const PLACE_STORAGE_COLLECTION = 'locations';

const PLACE_KIND_TAG_PREFIX = 'place-kind:';

/** Legacy API / DTO field on `locations` rows (outdoor catalog). */
export type LocationActivityTypeWire = 'hiking' | 'camping' | 'event' | 'shop';

const LOCATION_WIRE_SET = new Set<string>(['hiking', 'camping', 'event']);

export const isLocationActivityTypeWire = (value: string): value is LocationActivityTypeWire =>
  LOCATION_WIRE_SET.has(value);

/** Product labels for UI and admin. */
export const PLACE_KIND_LABELS: Record<PlaceKind, string> = {
  hiking: 'Hiking trail',
  camping: 'Camping spot',
  event: 'Event venue',
  outdoor_other: 'Outdoor place',
  shop: 'Shop',
  toilet: 'Toilet',
  gas_station: 'Gas station',
  water_refill: 'Water refill',
  parking: 'Parking',
  viewpoint: 'Viewpoint',
  picnic: 'Picnic area',
};

const KINDS_USING_PLACE_KIND_TAG: PlaceKind[] = [
  'shop',
  'toilet',
  'gas_station',
  'water_refill',
  'parking',
  'viewpoint',
  'picnic',
];

/** Amenity rows on the catalog — Spots lens + area rollups (`facilities`). */
export const FACILITY_PLACE_KINDS: readonly PlaceKind[] = [
  'toilet',
  'gas_station',
  'water_refill',
  'parking',
  'viewpoint',
  'picnic',
];

const FACILITY_PLACE_KIND_SET = new Set<PlaceKind>(FACILITY_PLACE_KINDS);

export const isFacilityPlaceKind = (kind: PlaceKind): boolean => FACILITY_PLACE_KIND_SET.has(kind);

/** Trail, camp, or amenity catalog pin — Spots lens (not shops layer). */
export const exploreVenueIsPlacesSpot = (
  mapKind: string,
  placeKind?: PlaceKind | null
): boolean => {
  if (mapKind === 'hiking' || mapKind === 'camping') return true;
  if (placeKind && isFacilityPlaceKind(placeKind)) return true;
  if (placeKind === 'outdoor_other') return true;
  return false;
};

export const outdoorPlaceKindPinEmoji = (): string => '🌳';

export const facilityPlaceKindPinEmoji = (kind: PlaceKind): string => {
  switch (kind) {
    case 'toilet':
      return '🚻';
    case 'gas_station':
      return '⛽';
    case 'water_refill':
      return '💧';
    case 'parking':
      return '🅿️';
    case 'viewpoint':
      return '👀';
    case 'picnic':
      return '🧺';
    default:
      return '📍';
  }
};

/**
 * Read canonical kind from a `locations` row (today: `activityType` + optional tags).
 */
export const placeKindFromLocationRow = (input: {
  activityType: string;
  tags?: string[] | null;
}): PlaceKind => {
  const kindTag = input.tags?.find((t) => t.startsWith(PLACE_KIND_TAG_PREFIX));
  if (kindTag) {
    const parsed = kindTag.slice(PLACE_KIND_TAG_PREFIX.length);
    if (isPlaceKind(parsed)) return parsed;
  }

  const wire = input.activityType.toLowerCase();
  if (wire === 'hiking') return 'hiking';
  if (wire === 'camping') return 'camping';
  if (wire === 'shop') return 'shop';
  if (wire === 'event') {
    if (input.tags?.includes('outdoor-other')) return 'outdoor_other';
    return 'event';
  }
  return 'hiking';
};

/** Write legacy `activityType` when creating/updating a `locations` document. */
export const locationActivityTypeForPlaceKind = (kind: PlaceKind): LocationActivityTypeWire => {
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  if (kind === 'shop') return 'shop';
  return 'event';
};

/** Tags to persist kind when wire `activityType` alone is not enough. */
export const tagsForPlaceKind = (kind: PlaceKind): string[] => {
  if (kind === 'outdoor_other') return ['outdoor-other'];
  if (KINDS_USING_PLACE_KIND_TAG.includes(kind)) return [`${PLACE_KIND_TAG_PREFIX}${kind}`];
  return [];
};

/** Kinds that use trail / camp / event public URLs (not `/shop`). */
export type PlaceDetailRouteKind = 'hiking' | 'camping' | 'event';

export const placeDetailRouteKindFromPlaceKind = (
  kind: PlaceKind
): PlaceDetailRouteKind => {
  if (kind === 'camping') return 'camping';
  if (kind === 'hiking') return 'hiking';
  return 'event';
};

/** Map contribute / Add FAB selection to canonical place kind. */
export const placeKindFromContributeVenueKind = (
  kind: 'hiking' | 'camping' | 'event' | 'shop'
): PlaceKind => (kind === 'shop' ? 'shop' : kind === 'event' ? 'outdoor_other' : kind);
