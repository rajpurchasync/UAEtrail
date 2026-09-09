import {
  inferJoinModeFromRequirements,
  type ActivityJoinMode,
} from '@uaetrail/shared-types';

export type { ActivityJoinMode };

export const normalizeJoinMode = (value: unknown): ActivityJoinMode =>
  value === 'private' ? 'private' : 'open';

/** Stored field wins; requirements text is the migration fallback. */
export const resolveJoinMode = (
  stored: unknown,
  requirements?: string[] | null
): ActivityJoinMode => {
  if (stored === 'private' || stored === 'open') return stored;
  return inferJoinModeFromRequirements(requirements);
};

export const shouldHideActivityFromExploreMap = (
  stored: unknown,
  requirements?: string[] | null
): boolean => resolveJoinMode(stored, requirements) === 'private';
