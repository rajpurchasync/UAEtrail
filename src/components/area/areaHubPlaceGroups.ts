import type { LocationDTO } from '@uaetrail/shared-types';
import {
  PLACE_KIND_LABELS,
  placeDetailRouteKindFromPlaceKind,
  placeKindFromLocationRow,
  type PlaceKind,
} from '@uaetrail/shared-types';

export type AreaHubPlaceGroupKey = 'trails' | 'camps' | 'facilities' | 'shops' | 'spots';

const FACILITY_KINDS = new Set<PlaceKind>([
  'toilet',
  'gas_station',
  'water_refill',
  'parking',
  'viewpoint',
  'picnic',
]);

const GROUP_ORDER: AreaHubPlaceGroupKey[] = ['trails', 'camps', 'shops', 'facilities', 'spots'];

const groupKeyForKind = (kind: PlaceKind): AreaHubPlaceGroupKey => {
  if (kind === 'hiking') return 'trails';
  if (kind === 'camping') return 'camps';
  if (kind === 'shop') return 'shops';
  if (FACILITY_KINDS.has(kind)) return 'facilities';
  return 'spots';
};

export const AREA_HUB_PLACE_GROUP_LABELS: Record<AreaHubPlaceGroupKey, string> = {
  trails: 'Trails',
  camps: 'Camps',
  shops: 'Shops',
  facilities: 'Facilities',
  spots: 'Outdoor spots',
};

export const groupAreaHubPlaces = (
  places: LocationDTO[]
): Array<{ key: AreaHubPlaceGroupKey; label: string; places: LocationDTO[] }> => {
  const buckets = new Map<AreaHubPlaceGroupKey, LocationDTO[]>();
  for (const place of places) {
    const kind = placeKindFromLocationRow({
      activityType: place.activityType,
      tags: place.tags,
    });
    const key = groupKeyForKind(kind);
    const list = buckets.get(key) ?? [];
    list.push(place);
    buckets.set(key, list);
  }

  return GROUP_ORDER
    .filter((key) => (buckets.get(key)?.length ?? 0) > 0)
    .map((key) => ({
      key,
      label: AREA_HUB_PLACE_GROUP_LABELS[key],
      places: buckets.get(key) ?? [],
    }));
};

export const placeKindLabelForRow = (place: LocationDTO): string => {
  const kind = placeKindFromLocationRow({
    activityType: place.activityType,
    tags: place.tags,
  });
  return PLACE_KIND_LABELS[kind];
};

export const placeDetailRouteKindForRow = (place: LocationDTO) =>
  placeDetailRouteKindFromPlaceKind(
    placeKindFromLocationRow({ activityType: place.activityType, tags: place.tags })
  );
