import { z } from 'zod';
import { ActivityType } from './enums.js';
import { ApiError } from '../lib/api-error.js';

export const sharedActivityTypeSchema = z.enum(['hiking', 'camping', 'community_activity']);
export type SharedActivityType = z.infer<typeof sharedActivityTypeSchema>;

export const toPrismaActivityType = (activityType: SharedActivityType): ActivityType => {
  if (activityType === 'hiking') return ActivityType.HIKING;
  if (activityType === 'camping') return ActivityType.CAMPING;
  return ActivityType.COMMUNITY_ACTIVITY;
};

export const fromPrismaActivityType = (activityType: ActivityType): SharedActivityType => {
  if (activityType === ActivityType.HIKING) return 'hiking';
  if (activityType === ActivityType.CAMPING) return 'camping';
  return 'community_activity';
};

export const assertLocationMatchesActivityType = (
  locationActivityType: ActivityType,
  requested: SharedActivityType
): void => {
  const normalized = fromPrismaActivityType(locationActivityType);
  if (normalized !== requested) {
    throw new ApiError(
      400,
      'activity_type_mismatch',
      `Selected location is for ${normalized.replace(/_/g, ' ')}, not ${requested.replace(/_/g, ' ')}.`
    );
  }
};
