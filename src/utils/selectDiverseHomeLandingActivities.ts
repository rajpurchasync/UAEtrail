import type { ActivityDTO } from '@uaetrail/shared-types';

export const HOME_LANDING_ACTIVITY_LIMIT = 8;
/** Pull a wider pool so type/place diversity has room to work. */
export const HOME_LANDING_ACTIVITY_FETCH_SIZE = 40;

const placeKey = (activity: ActivityDTO): string =>
  activity.locationId?.trim() ||
  activity.locationName?.trim().toLowerCase() ||
  activity.id;

/**
 * Prefer a mix of activity types and distinct places for the guest home rail.
 * Falls back to chronological fill when the pool is small or homogeneous.
 */
export const selectDiverseHomeLandingActivities = (
  items: ActivityDTO[],
  limit = HOME_LANDING_ACTIVITY_LIMIT
): ActivityDTO[] => {
  if (items.length <= limit) {
    return [...items].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')
    );
  }

  const byType = new Map<string, ActivityDTO[]>();
  for (const item of items) {
    const type = item.activityType || 'other';
    const bucket = byType.get(type);
    if (bucket) bucket.push(item);
    else byType.set(type, [item]);
  }

  const queues = [...byType.values()].map((list) => [...list]);
  const selected: ActivityDTO[] = [];
  const usedIds = new Set<string>();
  const usedPlaces = new Set<string>();

  let progressed = true;
  while (selected.length < limit && progressed) {
    progressed = false;
    for (const queue of queues) {
      if (selected.length >= limit) break;
      let pickIndex = queue.findIndex((row) => !usedIds.has(row.id) && !usedPlaces.has(placeKey(row)));
      if (pickIndex < 0) {
        pickIndex = queue.findIndex((row) => !usedIds.has(row.id));
      }
      if (pickIndex < 0) continue;
      const [pick] = queue.splice(pickIndex, 1);
      usedIds.add(pick.id);
      usedPlaces.add(placeKey(pick));
      selected.push(pick);
      progressed = true;
    }
  }

  if (selected.length < limit) {
    for (const item of items) {
      if (selected.length >= limit) break;
      if (usedIds.has(item.id)) continue;
      usedIds.add(item.id);
      selected.push(item);
    }
  }

  return selected.sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')
  );
};
