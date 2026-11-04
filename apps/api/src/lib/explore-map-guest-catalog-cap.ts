import {
  isGeographyMapSource,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';

/** Guest anti-scrape preview — full catalog requires sign-in. */
export const GUEST_EXPLORE_MAP_MAX_PLACES = 3;
export const GUEST_EXPLORE_MAP_MAX_EVENTS = 3;

const stableId = (item: ExploreMapItemDTO): string => item.id;

const isGuestMapPlaceItem = (item: ExploreMapItemDTO): boolean => {
  if (item.source === 'shop') return true;
  if (item.source === 'venue') return true;
  return isGeographyMapSource(item.source);
};

const isGuestMapEventItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'activity' || isTimeBoundExploreMapItem(item);

/**
 * Public `GET /explore/map` is anonymous for every caller (optionalAuth is not
 * allowed on that route). The cap stays off unless explicitly enabled, so the
 * public catalog contract is unchanged.
 */
export const isGuestExploreMapCatalogCapEnabled = (): boolean =>
  process.env.EXPLORE_MAP_GUEST_CATALOG_CAP === '1';

export const applyGuestExploreMapCatalogCap = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] => {
  const places = items.filter(isGuestMapPlaceItem).sort((a, b) => stableId(a).localeCompare(stableId(b)));
  const events = items.filter(isGuestMapEventItem).sort((a, b) => stableId(a).localeCompare(stableId(b)));
  const other = items.filter((item) => !isGuestMapPlaceItem(item) && !isGuestMapEventItem(item));

  const allowedIds = new Set<string>([
    ...places.slice(0, GUEST_EXPLORE_MAP_MAX_PLACES).map((item) => item.id),
    ...events.slice(0, GUEST_EXPLORE_MAP_MAX_EVENTS).map((item) => item.id),
    ...other.map((item) => item.id),
  ]);

  return items.filter((item) => allowedIds.has(item.id));
};

export const guestExploreMapCatalogCapApplied = (
  before: ExploreMapItemDTO[],
  after: ExploreMapItemDTO[]
): boolean => before.length !== after.length;
