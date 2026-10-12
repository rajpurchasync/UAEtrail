import { z } from 'zod';
import { ActivityType } from './enums.js';
import { ApiError } from '../lib/api-error.js';
import type { Activity, Location } from './types.js';

export const sharedActivityTypeSchema = z
  .enum(['hiking', 'camping', 'event', 'community_activity', 'rideshare', 'shop'])
  .transform((value): SharedActivityType => (value === 'community_activity' ? 'event' : value));

export type SharedActivityType = 'hiking' | 'camping' | 'event' | 'rideshare' | 'shop';

export const toPrismaActivityType = (activityType: string): ActivityType => {
  const normalized = activityType.toLowerCase();
  if (normalized === 'hiking') return ActivityType.HIKING;
  if (normalized === 'camping') return ActivityType.CAMPING;
  if (normalized === 'rideshare' || normalized === 'carpool') return ActivityType.RIDESHARE;
  if (normalized === 'shop') return ActivityType.SHOP;
  return ActivityType.EVENT;
};

export const fromPrismaActivityType = (activityType: ActivityType | string): SharedActivityType => {
  const normalized = String(activityType).toUpperCase();
  if (normalized === 'HIKING') return 'hiking';
  if (normalized === 'CAMPING') return 'camping';
  if (normalized === 'RIDESHARE' || normalized === 'CARPOOL') return 'rideshare';
  if (normalized === 'SHOP') return 'shop';
  return 'event';
};

export const resolveActivityDtoType = (
  activity: Pick<Activity, 'activityType' | 'rideshareEnabled'>,
  location: Pick<Location, 'activityType'>
): SharedActivityType => {
  if (activity.activityType) return fromPrismaActivityType(activity.activityType);
  return fromPrismaActivityType(location.activityType);
};

export const assertLocationMatchesActivityType = (
  locationActivityType: ActivityType,
  requested: SharedActivityType
): void => {
  if (requested === 'rideshare') return;

  const normalized = fromPrismaActivityType(locationActivityType);
  if (normalized !== requested) {
    throw new ApiError(
      400,
      'activity_type_mismatch',
      `Selected location is for ${normalized}, not ${requested}.`
    );
  }
};

const hasLegacyLinkedRideshareRouteFields = (body: {
  rideshareFromLat?: number;
  rideshareFromLng?: number;
  rideshareToLat?: number;
  rideshareToLng?: number;
  rideshareFromPoint?: string;
  rideshareToPoint?: string;
}): boolean =>
  body.rideshareFromLat != null ||
  body.rideshareFromLng != null ||
  body.rideshareToLat != null ||
  body.rideshareToLng != null ||
  Boolean(body.rideshareFromPoint?.trim()) ||
  Boolean(body.rideshareToPoint?.trim());

/** Reject legacy linked rideshare *route* fields on hiking/camping/events — not `rideshareEnabled` ride offers. */
export const assertNoLegacyLinkedRideshareFields = (
  activityType: SharedActivityType | string | undefined,
  body: {
    rideshareEnabled?: boolean;
    rideshareFromLat?: number;
    rideshareFromLng?: number;
    rideshareToLat?: number;
    rideshareToLng?: number;
    rideshareFromPoint?: string;
    rideshareToPoint?: string;
  }
): void => {
  if (String(activityType ?? '').toLowerCase() === 'rideshare') return;

  if (hasLegacyLinkedRideshareRouteFields(body)) {
    throw new ApiError(
      400,
      'linked_rideshare_deprecated',
      'Legacy linked rideshare routes are no longer supported. Offer a rideshare from your activity or create a standalone rideshare listing.'
    );
  }
};

export const assertRideshareActivityFields = (body: {
  activityType: SharedActivityType;
  meetingLat?: number;
  meetingLng?: number;
  startLat?: number;
  startLng?: number;
  meetingPoint?: string;
  startPoint?: string;
}): void => {
  if (body.activityType !== 'rideshare') return;

  const hasFromCoords = body.meetingLat != null && body.meetingLng != null;
  const hasToCoords = body.startLat != null && body.startLng != null;
  if (!hasFromCoords || !hasToCoords) {
    throw new ApiError(
      400,
      'rideshare_coords_required',
      'Rideshare requires from and to map coordinates.'
    );
  }

  if (!body.meetingPoint?.trim() || !body.startPoint?.trim()) {
    throw new ApiError(
      400,
      'rideshare_labels_required',
      'Rideshare requires from and to location labels.'
    );
  }
};
