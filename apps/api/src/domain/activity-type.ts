import { z } from 'zod';
import { ActivityType } from './enums.js';
import { ApiError } from '../lib/api-error.js';
import type { Activity, Location } from './types.js';

export const sharedActivityTypeSchema = z
  .enum(['hiking', 'camping', 'event', 'community_activity', 'carpool'])
  .transform((value): SharedActivityType => (value === 'community_activity' ? 'event' : value));

export type SharedActivityType = 'hiking' | 'camping' | 'event' | 'carpool';

export const toPrismaActivityType = (activityType: string): ActivityType => {
  const normalized = activityType.toLowerCase();
  if (normalized === 'hiking') return ActivityType.HIKING;
  if (normalized === 'camping') return ActivityType.CAMPING;
  if (normalized === 'carpool') return ActivityType.CARPOOL;
  return ActivityType.EVENT;
};

export const fromPrismaActivityType = (activityType: ActivityType | string): SharedActivityType => {
  const normalized = String(activityType).toUpperCase();
  if (normalized === 'HIKING') return 'hiking';
  if (normalized === 'CAMPING') return 'camping';
  if (normalized === 'CARPOOL') return 'carpool';
  return 'event';
};

export const isCarpoolActivityType = (activityType: ActivityType | SharedActivityType | string): boolean =>
  String(activityType).toUpperCase() === 'CARPOOL' || String(activityType).toLowerCase() === 'carpool';

export const resolveActivityDtoType = (
  activity: Pick<Activity, 'activityType' | 'carPoolEnabled'>,
  location: Pick<Location, 'activityType'>
): SharedActivityType => {
  if (activity.activityType) return fromPrismaActivityType(activity.activityType);
  if (activity.carPoolEnabled) return 'carpool';
  return fromPrismaActivityType(location.activityType);
};

export const assertLocationMatchesActivityType = (
  locationActivityType: ActivityType,
  requested: SharedActivityType
): void => {
  if (requested === 'carpool') return;

  const normalized = fromPrismaActivityType(locationActivityType);
  if (normalized !== requested) {
    throw new ApiError(
      400,
      'activity_type_mismatch',
      `Selected location is for ${normalized}, not ${requested}.`
    );
  }
};

export const assertCarpoolActivityFields = (body: {
  activityType: SharedActivityType;
  meetingLat?: number;
  meetingLng?: number;
  startLat?: number;
  startLng?: number;
  meetingPoint?: string;
  startPoint?: string;
}): void => {
  if (body.activityType !== 'carpool') return;

  const hasFromCoords = body.meetingLat != null && body.meetingLng != null;
  const hasToCoords = body.startLat != null && body.startLng != null;
  if (!hasFromCoords || !hasToCoords) {
    throw new ApiError(
      400,
      'carpool_coords_required',
      'Carpool requires from and to map coordinates.'
    );
  }

  if (!body.meetingPoint?.trim() || !body.startPoint?.trim()) {
    throw new ApiError(
      400,
      'carpool_labels_required',
      'Carpool requires from and to location labels.'
    );
  }
};
