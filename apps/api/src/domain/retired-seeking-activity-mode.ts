/** Retired Mongo `activities.activityMode` — ops residue only (MIG-DISCO-REG). */
export const RETIRED_SEEKING_ACTIVITY_MODE = 'seeking' as const;

export type RetiredSeekingActivityMode = typeof RETIRED_SEEKING_ACTIVITY_MODE;

export const isRetiredSeekingActivityMode = (mode: unknown): mode is RetiredSeekingActivityMode =>
  mode === RETIRED_SEEKING_ACTIVITY_MODE;

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

export const mongoUpcomingPublishedOrRetiredSeeking = (now: Date) => ({
  $or: [mongoOnlyRetiredSeekingActivityMode, { startAt: { $gte: now } }],
});

export const mongoPastPublishedExcludeRetiredSeeking = (now: Date) => ({
  startAt: { $lt: now },
  ...mongoExcludeRetiredSeekingActivityMode,
});