export type RideshareDestinationKind =
  | 'map'
  | 'activity_meeting'
  | 'catalog_place'
  | 'pending_place';

export const RIDESHARE_DESTINATION_ACTIVITY_PREFIX = 'Rideshare destination activity:';
export const RIDESHARE_DESTINATION_PLACE_PREFIX = 'Rideshare destination place:';
export const RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX = 'Rideshare pending destination place:';

export const rideshareDestinationActivityId = (requirements: string[] | null | undefined): string | null => {
  const line = (requirements ?? []).find((row) => row.startsWith(RIDESHARE_DESTINATION_ACTIVITY_PREFIX));
  if (!line) return null;
  const id = line.slice(RIDESHARE_DESTINATION_ACTIVITY_PREFIX.length).trim();
  return id || null;
};

export const rideshareDestinationPlaceId = (requirements: string[] | null | undefined): string | null => {
  const pending = (requirements ?? []).find((row) =>
    row.startsWith(RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX)
  );
  if (pending) {
    const id = pending.slice(RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX.length).trim();
    return id || null;
  }
  const line = (requirements ?? []).find((row) => row.startsWith(RIDESHARE_DESTINATION_PLACE_PREFIX));
  if (!line) return null;
  const id = line.slice(RIDESHARE_DESTINATION_PLACE_PREFIX.length).trim();
  return id || null;
};

export const rideshareHasPendingDestinationPlace = (
  requirements: string[] | null | undefined
): boolean =>
  (requirements ?? []).some((row) => row.startsWith(RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX));
