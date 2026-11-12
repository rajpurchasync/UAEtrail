import {
  FACILITY_PLACE_KINDS,
  PLACE_KIND_LABELS,
  isFacilityPlaceKind,
  resolveExplorePrice,
  type ExploreMapItemDTO,
  type PlaceKind,
} from '@uaetrail/shared-types';
import { isBuddyMapItem, isPlacesMapItem, isShopListItem } from './ui/exploreMapPinModel';
import {
  togglePlaceMapTopic,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from './exploreMapQuickTopicFilters';

export const EXPLORE_PRICE_PARAM = 'price';
export const EXPLORE_HAS_TRIP_PARAM = 'hasTrip';
export const EXPLORE_FACILITY_KINDS_PARAM = 'facilityKinds';

export type ExplorePriceFilter = 'all' | 'free' | 'shared' | 'paid';

export type ExploreVenueFilterPatch = {
  placeTopics: PlaceMapTopicKey[];
  facilityKinds: PlaceKind[];
};

export const EXPLORE_TRIP_SCOPE_RESTING_LABEL = 'All trips';
export const EXPLORE_PLACE_SCOPE_RESTING_LABEL = 'All kinds';
export const EXPLORE_PRICE_SCOPE_RESTING_LABEL = 'Any price';
export const EXPLORE_REGION_SCOPE_RESTING_LABEL = 'All UAE';
export const EXPLORE_HAS_TRIP_LABEL = 'Active trips';
export const EXPLORE_TRIP_SCOPE_EMOJI = '🏃';
export const EXPLORE_PRICE_SCOPE_EMOJI = '💰';

export const EXPLORE_TRIP_TOPIC_OPTIONS: ReadonlyArray<{ key: TripMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'rideshare', label: 'Rideshare' },
  { key: 'others', label: 'Other' },
];

export const EXPLORE_PLACE_TOPIC_OPTIONS: ReadonlyArray<{ key: PlaceMapTopicKey; label: string }> = [
  { key: 'hiking', label: 'Hiking trail' },
  { key: 'camping', label: 'Camping spots' },
  { key: 'others', label: 'Hubs' },
];

export const EXPLORE_FACILITY_SCOPE_RESTING_LABEL = 'By facilities';
export const EXPLORE_FACILITY_SCOPE_EMOJI = '🚻';

export type ExploreFacilityPillKey = 'toilet' | 'gas_station' | 'shops';

export const EXPLORE_FACILITY_PILL_OPTIONS: ReadonlyArray<{
  key: ExploreFacilityPillKey;
  label: string;
}> = [
  { key: 'toilet', label: 'Toilets' },
  { key: 'gas_station', label: 'Gas station' },
  { key: 'shops', label: 'Shops' },
];

const PLACE_DESTINATION_TOPIC_SET = new Set<PlaceMapTopicKey>(['hiking', 'camping', 'others']);

export const destinationPlaceTopicsFrom = (
  topics: readonly PlaceMapTopicKey[]
): PlaceMapTopicKey[] => topics.filter((key) => PLACE_DESTINATION_TOPIC_SET.has(key));

export const facilityPlaceTopicsFrom = (topics: readonly PlaceMapTopicKey[]): PlaceMapTopicKey[] =>
  topics.filter((key) => key === 'facilities' || key === 'shops');

export const toggleExploreDestinationPlaceTopic = (
  placeTopics: readonly PlaceMapTopicKey[],
  key: PlaceMapTopicKey
): PlaceMapTopicKey[] => [
  ...togglePlaceMapTopic(destinationPlaceTopicsFrom(placeTopics), key),
  ...facilityPlaceTopicsFrom(placeTopics),
];

export const clearExploreDestinationPlaceTopics = (
  placeTopics: readonly PlaceMapTopicKey[]
): PlaceMapTopicKey[] => facilityPlaceTopicsFrom(placeTopics);

export const exploreFacilityPillSelectedKeys = (
  placeTopics: readonly PlaceMapTopicKey[],
  facilityKinds: readonly PlaceKind[]
): ExploreFacilityPillKey[] => {
  const keys: ExploreFacilityPillKey[] = [];
  if (facilityKinds.includes('toilet')) keys.push('toilet');
  if (facilityKinds.includes('gas_station')) keys.push('gas_station');
  if (placeTopics.includes('shops')) keys.push('shops');
  return keys;
};

export const toggleExploreFacilityPillKey = (
  placeTopics: readonly PlaceMapTopicKey[],
  facilityKinds: readonly PlaceKind[],
  key: ExploreFacilityPillKey
): { placeTopics: PlaceMapTopicKey[]; facilityKinds: PlaceKind[] } => {
  if (key === 'shops') {
    return {
      placeTopics: togglePlaceMapTopic([...placeTopics], 'shops'),
      facilityKinds: [...facilityKinds],
    };
  }
  const nextKinds = toggleFacilityKindSelection(facilityKinds, key);
  const withoutFacilities = placeTopics.filter((topic) => topic !== 'facilities');
  return {
    placeTopics: nextKinds.length > 0 ? [...withoutFacilities, 'facilities'] : withoutFacilities,
    facilityKinds: nextKinds,
  };
};

export const clearExploreFacilityPill = (
  placeTopics: readonly PlaceMapTopicKey[]
): { placeTopics: PlaceMapTopicKey[]; facilityKinds: PlaceKind[] } => ({
  placeTopics: placeTopics.filter((topic) => topic !== 'facilities' && topic !== 'shops'),
  facilityKinds: [],
});

export const exploreFacilityPillIsActive = (
  placeTopics: readonly PlaceMapTopicKey[],
  facilityKinds: readonly PlaceKind[]
): boolean =>
  placeTopics.includes('shops') ||
  placeTopics.includes('facilities') ||
  facilityKinds.length > 0;

export const EXPLORE_PRICE_FILTER_OPTIONS: ReadonlyArray<{
  key: ExplorePriceFilter;
  label: string;
}> = [
  { key: 'all', label: EXPLORE_PRICE_SCOPE_RESTING_LABEL },
  { key: 'free', label: 'Free' },
  { key: 'shared', label: 'Shared' },
  { key: 'paid', label: 'Paid' },
];

export const EXPLORE_FACILITY_KIND_OPTIONS: ReadonlyArray<{ key: PlaceKind; label: string }> =
  FACILITY_PLACE_KINDS.map((kind) => ({
    key: kind,
    label: PLACE_KIND_LABELS[kind],
  }));

const PRICE_SET = new Set<ExplorePriceFilter>(['all', 'free', 'shared', 'paid']);
const FACILITY_KIND_SET = new Set<PlaceKind>(FACILITY_PLACE_KINDS);

export const parseExplorePriceFilter = (value: string | null): ExplorePriceFilter => {
  if (value && PRICE_SET.has(value as ExplorePriceFilter) && value !== 'all') {
    return value as ExplorePriceFilter;
  }
  return 'all';
};

export const serializeExplorePriceFilter = (price: ExplorePriceFilter): string | null =>
  price === 'all' ? null : price;

export const parseExploreHasTrip = (value: string | null): boolean => value === '1';

export const serializeExploreHasTrip = (hasTrip: boolean): string | null => (hasTrip ? '1' : null);

export const parseExploreFacilityKinds = (value: string | null): PlaceKind[] => {
  if (!value?.trim()) return [];
  const out: PlaceKind[] = [];
  for (const part of value.split(',')) {
    const key = part.trim() as PlaceKind;
    if (FACILITY_KIND_SET.has(key) && !out.includes(key)) out.push(key);
  }
  return out;
};

export const serializeExploreFacilityKinds = (kinds: readonly PlaceKind[]): string | null =>
  kinds.length > 0 ? kinds.join(',') : null;

export const formatExploreMultiSelectPillLabel = (
  selected: readonly string[],
  options: ReadonlyArray<{ key: string; label: string }>,
  resting: string
): string => {
  if (selected.length === 0) return resting;
  const labels = selected
    .map((key) => options.find((option) => option.key === key)?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return resting;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} + ${labels[1]}`;
  return `${labels[0]} +${labels.length - 1}`;
};

export const explorePriceFilterLabel = (price: ExplorePriceFilter): string =>
  EXPLORE_PRICE_FILTER_OPTIONS.find((option) => option.key === price)?.label ??
  EXPLORE_PRICE_SCOPE_RESTING_LABEL;

/** List `filter=shop` / `placeTopics: shop` ↔ map `placeTypes=shops`. */
export const aliasListPlaceTopicToMap = (key: string): PlaceMapTopicKey | null => {
  if (key === 'shop' || key === 'shops') return 'shops';
  if (key === 'hubs' || key === 'others') return 'others';
  if (key === 'hiking' || key === 'camping' || key === 'facilities') return key;
  return null;
};

export const aliasPlaceMapTopicToList = (
  key: PlaceMapTopicKey
): 'hiking' | 'camping' | 'facilities' | 'shop' | 'others' => (key === 'shops' ? 'shop' : key);

export const exploreItemPriceKind = (item: ExploreMapItemDTO): ExplorePriceFilter => {
  if (item.priceLabel === 'free' || item.priceLabel === 'shared' || item.priceLabel === 'paid') {
    return item.priceLabel;
  }
  const pricingMode = item.activity?.pricingMode;
  if (pricingMode === 'free' || pricingMode === 'shared' || pricingMode === 'paid') {
    return pricingMode;
  }
  return resolveExplorePrice({
    isRideshare: item.kind === 'rideshare',
    price: item.activity?.price ?? item.priceAed ?? null,
    rideshareFree: item.activity?.rideshareFree ?? null,
    ridesharePriceAed: item.activity?.ridesharePriceAed ?? null,
    priceLabel: item.priceLabel ?? null,
    priceDisplay: item.priceDisplay ?? null,
  }).kind;
};

export const exploreItemMatchesPriceFilter = (
  item: ExploreMapItemDTO,
  price: ExplorePriceFilter
): boolean => {
  if (price === 'all') return true;
  if (!isBuddyMapItem(item)) return true;
  return exploreItemPriceKind(item) === price;
};

const catalogLocationId = (item: ExploreMapItemDTO): string | null => {
  const fromCard = item.locationCard?.id?.trim();
  if (fromCard) return fromCard;
  const fromActivity = item.activity?.locationId?.trim();
  if (fromActivity) return fromActivity;
  return null;
};

export const hostedPlaceLocationIdsFromCatalog = (catalog: readonly ExploreMapItemDTO[]): Set<string> => {
  const ids = new Set<string>();
  for (const item of catalog) {
    if (!isBuddyMapItem(item)) continue;
    if (item.activityMode === 'seeking') continue;
    const locationId = catalogLocationId(item);
    if (locationId) ids.add(locationId);
  }
  return ids;
};

export type HostedOutingPlaceSummary = {
  count: number;
  nextDateIso: string | null;
  nextPath: string | null;
  nextExploreItemId: string | null;
};

const outingPath = (item: ExploreMapItemDTO): string | null => {
  const fromItem = item.path?.trim();
  if (fromItem) return fromItem;
  const activityId = item.activity?.id?.trim();
  return activityId ? `/activity/${activityId}` : null;
};

const outingDateIso = (item: ExploreMapItemDTO): string | null => {
  const raw = item.date?.trim() || item.activity?.date?.trim() || '';
  const iso = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
};

/** Upcoming hosted outings keyed by catalog place id — list venue “trips here” hint. */
export const hostedOutingSummariesByPlaceId = (
  catalog: readonly ExploreMapItemDTO[]
): Map<string, HostedOutingPlaceSummary> => {
  const byPlace = new Map<string, HostedOutingPlaceSummary>();
  for (const item of catalog) {
    if (!isBuddyMapItem(item)) continue;
    if (item.activityMode === 'seeking') continue;
    const locationId = catalogLocationId(item);
    if (!locationId) continue;
    const dateIso = outingDateIso(item);
    const path = outingPath(item);
    const current = byPlace.get(locationId) ?? {
      count: 0,
      nextDateIso: null,
      nextPath: null,
      nextExploreItemId: null,
    };
    current.count += 1;
    if (!current.nextPath && path) {
      current.nextPath = path;
      current.nextExploreItemId = item.id;
    }
    if (dateIso && (!current.nextDateIso || dateIso < current.nextDateIso)) {
      current.nextDateIso = dateIso;
      if (path) {
        current.nextPath = path;
        current.nextExploreItemId = item.id;
      }
    }
    byPlace.set(locationId, current);
  }
  return byPlace;
};

export const explorePlaceHasHostedTrip = (
  place: ExploreMapItemDTO,
  hostedLocationIds: ReadonlySet<string>
): boolean => {
  if (!isPlacesMapItem(place) && !isShopListItem(place)) return false;
  const locationId = catalogLocationId(place);
  return Boolean(locationId && hostedLocationIds.has(locationId));
};

export const exploreItemMatchesFacilityKinds = (
  item: ExploreMapItemDTO,
  kinds: readonly PlaceKind[]
): boolean => {
  if (kinds.length === 0) return true;
  if (item.placeKind && isFacilityPlaceKind(item.placeKind)) {
    return kinds.includes(item.placeKind);
  }
  const amenityKinds = item.locationCard?.amenityKinds ?? [];
  return kinds.some((kind) => amenityKinds.includes(kind));
};

/** Picking an amenity kind with no place type means Facilities, not all places. */
export const effectivePlaceTopicsForFacilityKinds = (
  placeTopics: readonly PlaceMapTopicKey[],
  facilityKinds: readonly PlaceKind[]
): PlaceMapTopicKey[] => {
  if (placeTopics.length > 0 || facilityKinds.length === 0) return [...placeTopics];
  return ['facilities'];
};

export const toggleFacilityKindSelection = (
  current: readonly PlaceKind[],
  key: PlaceKind
): PlaceKind[] => {
  const set = new Set(current);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return FACILITY_PLACE_KINDS.filter((kind) => set.has(kind));
};
