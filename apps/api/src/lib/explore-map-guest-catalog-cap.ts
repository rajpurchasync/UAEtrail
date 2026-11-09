import {
  isGeographyMapSource,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';

/** Guest anti-scrape preview — full catalog requires sign-in. */
export const GUEST_EXPLORE_MAP_MAX_PLACES = 3;
export const GUEST_EXPLORE_MAP_MAX_EVENTS = 3;

const isGuestMapPlaceItem = (item: ExploreMapItemDTO): boolean => {
  if (item.source === 'shop') return true;
  if (item.source === 'venue') return true;
  return isGeographyMapSource(item.source);
};

const isGuestMapEventItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'activity' || isTimeBoundExploreMapItem(item);

const parseCatalogInstant = (value: string | null | undefined): number => {
  if (!value?.trim()) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

/** Oldest posted first; stable id tie-break so guests always see the same preview set. */
export const compareGuestPreviewEvents = (a: ExploreMapItemDTO, b: ExploreMapItemDTO): number => {
  const byPosted = parseCatalogInstant(a.catalogPostedAt) - parseCatalogInstant(b.catalogPostedAt);
  if (byPosted !== 0) return byPosted;
  return a.id.localeCompare(b.id);
};

/** Oldest catalog update first; stable id tie-break. */
export const compareGuestPreviewPlaces = (a: ExploreMapItemDTO, b: ExploreMapItemDTO): number => {
  const byUpdated = parseCatalogInstant(a.catalogUpdatedAt) - parseCatalogInstant(b.catalogUpdatedAt);
  if (byUpdated !== 0) return byUpdated;
  return a.id.localeCompare(b.id);
};

/**
 * Legacy pin-list cap (3 places + 3 events) — used by `GET /explore/seeking-activities` for guests.
 * `GET /explore/map` returns the full catalog for guests; peek depth is enforced in the client.
 * Set `EXPLORE_MAP_GUEST_CATALOG_CAP=0` to disable caps on auxiliary guest reads.
 */
export const isGuestExploreMapCatalogCapEnabled = (): boolean =>
  process.env.EXPLORE_MAP_GUEST_CATALOG_CAP !== '0';

export const applyGuestExploreMapCatalogCap = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] => {
  const places = items.filter(isGuestMapPlaceItem).sort(compareGuestPreviewPlaces);
  const events = items.filter(isGuestMapEventItem).sort(compareGuestPreviewEvents);

  const allowedIds = new Set<string>([
    ...places.slice(0, GUEST_EXPLORE_MAP_MAX_PLACES).map((item) => item.id),
    ...events.slice(0, GUEST_EXPLORE_MAP_MAX_EVENTS).map((item) => item.id),
  ]);

  return items.filter((item) => allowedIds.has(item.id));
};

export const guestExploreMapCatalogCapApplied = (
  before: ExploreMapItemDTO[],
  after: ExploreMapItemDTO[]
): boolean => before.length !== after.length;
