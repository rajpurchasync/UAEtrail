/** Hosted outing waiting on admin approval of a newly submitted catalog place. */
export const PENDING_VENUE_PLACE_PREFIX = 'Pending venue place:';

export const pendingVenuePlaceId = (requirements: string[] | null | undefined): string | null => {
  const line = (requirements ?? []).find((row) => row.startsWith(PENDING_VENUE_PLACE_PREFIX));
  if (!line) return null;
  const id = line.slice(PENDING_VENUE_PLACE_PREFIX.length).trim();
  return id || null;
};

export const activityHasPendingVenuePlace = (
  requirements: string[] | null | undefined
): boolean => (requirements ?? []).some((row) => row.startsWith(PENDING_VENUE_PLACE_PREFIX));
