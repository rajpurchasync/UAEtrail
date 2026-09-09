export type ActivityJoinMode = 'open' | 'private';

export const PRIVATE_JOIN_REQUIREMENT_PREFIX = 'Private: group or invite only';

/** Legacy fallback when `joinMode` is not stored on the activity document. */
export const inferJoinModeFromRequirements = (
  requirements: string[] | null | undefined
): ActivityJoinMode =>
  (requirements ?? []).some((item) => item.trim().startsWith(PRIVATE_JOIN_REQUIREMENT_PREFIX))
    ? 'private'
    : 'open';
