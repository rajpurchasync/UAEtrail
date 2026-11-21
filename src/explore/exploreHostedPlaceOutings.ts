import { isTimeBoundExploreMapItem, type ExploreMapItemDTO } from '@uaetrail/shared-types';

const catalogLocationId = (item: ExploreMapItemDTO): string | null => {
  const fromCard = item.locationCard?.id?.trim();
  if (fromCard) return fromCard;
  const fromActivity = item.activity?.locationId?.trim();
  if (fromActivity) return fromActivity;
  return null;
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

export const hostedPlaceLocationIdsFromCatalog = (catalog: readonly ExploreMapItemDTO[]): Set<string> => {
  const ids = new Set<string>();
  for (const item of catalog) {
    if (!isTimeBoundExploreMapItem(item)) continue;
    if (item.activityMode === 'seeking') continue;
    const locationId = catalogLocationId(item);
    if (locationId) ids.add(locationId);
  }
  return ids;
};

/** Upcoming hosted outings keyed by catalog place id — list venue “trips here” hint. */
export const hostedOutingSummariesByPlaceId = (
  catalog: readonly ExploreMapItemDTO[]
): Map<string, HostedOutingPlaceSummary> => {
  const byPlace = new Map<string, HostedOutingPlaceSummary>();
  for (const item of catalog) {
    if (!isTimeBoundExploreMapItem(item)) continue;
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