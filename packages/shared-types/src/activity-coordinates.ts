/** Raw coordinate fields on ActivityDTO used to derive map pin position. */
export type ActivityCoordinateSource = {
  meetingLat?: number | null;
  meetingLng?: number | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
};

/** Canonical map pin coordinates — meeting → start → parking → venue. */
export const resolveActivityDisplayCoordinates = (
  activity: ActivityCoordinateSource
): { latitude: number | null; longitude: number | null } => {
  const latitude =
    activity.meetingLat ??
    activity.startLat ??
    activity.parkingLat ??
    activity.locationLatitude ??
    null;
  const longitude =
    activity.meetingLng ??
    activity.startLng ??
    activity.parkingLng ??
    activity.locationLongitude ??
    null;
  return { latitude, longitude };
};

/** Carpool destination pin when start coordinates exist. */
export const resolveActivityDestinationCoordinates = (
  activity: Pick<ActivityCoordinateSource, 'startLat' | 'startLng'>
): { latitude: number | null; longitude: number | null } => {
  if (activity.startLat == null || activity.startLng == null) {
    return { latitude: null, longitude: null };
  }
  return { latitude: activity.startLat, longitude: activity.startLng };
};
