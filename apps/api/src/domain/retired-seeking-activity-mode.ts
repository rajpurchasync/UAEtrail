/**
 * Retired Mongo `activities.activityMode` — ops residue only (MIG-DISCO-REG).
 * Literal lives in shared-types; this module is Mongo query helpers.
 */
import {
  RETIRED_SEEKING_ACTIVITY_MODE,
  isRetiredSeekingActivityModeValue,
  type RetiredSeekingActivityModeWire,
} from '@uaetrail/shared-types';

export { RETIRED_SEEKING_ACTIVITY_MODE };
export type RetiredSeekingActivityMode = RetiredSeekingActivityModeWire;

export const isRetiredSeekingActivityMode = isRetiredSeekingActivityModeValue;

export const publicActivityModeFromStored = (
  mode: string | null | undefined
): 'hosted' | null | undefined =>
  isRetiredSeekingActivityMode(mode) ? null : (mode as 'hosted' | null | undefined) ?? null;

export const mongoExcludeRetiredSeekingActivityMode = {
  activityMode: { $ne: RETIRED_SEEKING_ACTIVITY_MODE },
} as const;

export const mongoOnlyRetiredSeekingActivityMode = {
  activityMode: RETIRED_SEEKING_ACTIVITY_MODE,
} as const;

/** Upcoming hosted publish — retired seeking rows are excluded, not OR'd in. */
export const mongoUpcomingPublished = (now: Date) => ({
  startAt: { $gte: now },
  ...mongoExcludeRetiredSeekingActivityMode,
});

export const mongoPastPublishedExcludeRetiredSeeking = (now: Date) => ({
  startAt: { $lt: now },
  ...mongoExcludeRetiredSeekingActivityMode,
});
