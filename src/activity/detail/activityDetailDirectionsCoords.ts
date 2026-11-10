import type { ActivityDetailDTO } from '@uaetrail/shared-types';

/** Best lat/lng for directions / detail maps (meeting → start → parking → venue). */
export const resolveActivityDetailDirectionsCoords = (
  activity: ActivityDetailDTO,
  accessLat?: number | null,
  accessLng?: number | null
): { lat: number | null; lng: number | null } => {
  const lat =
    accessLat ??
    activity.startLat ??
    activity.meetingLat ??
    activity.parkingLat ??
    activity.displayLatitude ??
    activity.location?.latitude ??
    null;
  const lng =
    accessLng ??
    activity.startLng ??
    activity.meetingLng ??
    activity.parkingLng ??
    activity.displayLongitude ??
    activity.location?.longitude ??
    null;
  return { lat, lng };
};
