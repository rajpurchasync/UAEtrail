import type { ActivityDetailDTO } from '@uaetrail/shared-types';

type RideshareDirectionActivity = Pick<
  ActivityDetailDTO,
  'activityType' | 'meetingPoint' | 'meetingLat' | 'meetingLng' | 'startPoint' | 'startLat' | 'startLng'
>;

/** Ride detail already shows directions to this pin on the pickup or drop-off card. */
export const rideshareCardCoversDirections = (
  activity: RideshareDirectionActivity,
  lat: number,
  lng: number
): boolean => {
  if (activity.activityType !== 'rideshare') return false;

  const pickup = activity.meetingPoint?.trim();
  if (
    pickup &&
    activity.meetingLat != null &&
    activity.meetingLng != null &&
    activity.meetingLat === lat &&
    activity.meetingLng === lng
  ) {
    return true;
  }

  const dropoff = activity.startPoint?.trim();
  if (
    dropoff &&
    dropoff !== pickup &&
    activity.startLat != null &&
    activity.startLng != null &&
    activity.startLat === lat &&
    activity.startLng === lng
  ) {
    return true;
  }

  return false;
};
