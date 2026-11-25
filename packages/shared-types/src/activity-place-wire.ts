/**
 * Activity → catalog **Place (site)** link (`locations` collection).
 * Product name: **Place** — wire field `locationId` (legacy Mongo key).
 * Emit **`placeId`** on read DTOs as the synonym new clients should prefer.
 */

export const BWL_ACTIVITY_PLACE_FIELDS = {
  /** Persisted FK on `activities` — catalog place row id. */
  LOCATION_ID: 'locationId',
  /** Read-model alias — same value as `locationId`. */
  PLACE_ID: 'placeId',
} as const;

export type ActivityPlaceLinkWire = {
  locationId?: string | null;
  placeId?: string | null;
};

/** Resolve canonical place id from inbound wire (`placeId` preferred when both match). */
export const resolveActivityPlaceLinkId = (input: ActivityPlaceLinkWire): string | null => {
  const locationId = input.locationId?.trim() ?? '';
  const placeId = input.placeId?.trim() ?? '';
  if (locationId && placeId && locationId !== placeId) return null;
  return placeId || locationId || null;
};

/** Activity DTO / explore payloads — always mirror both keys when a link exists. */
export const withActivityPlaceIdAlias = <T extends { locationId: string }>(
  row: T
): T & { placeId: string } => ({
  ...row,
  placeId: row.locationId,
});