import type { ActivityJoinMode } from './activity-join-mode.js';

export type ParticipationMode = 'rsvp' | 'approval';

/** Written by explore compose publish until `participationMode` is stored on the activity. */
export const RSVP_PARTICIPATION_REQUIREMENT = 'Open RSVP — tap I\'m going to join';

/** Written by explore compose publish until `participationMode` is stored on the activity. */
export const APPROVAL_PARTICIPATION_REQUIREMENT = 'Organizer approval required to join';

/** @deprecated Legacy requirement line on older activities */
export const LEGACY_APPROVAL_PARTICIPATION_REQUIREMENT = 'Host approval required to join';

const isApprovalRequirementLine = (line: string): boolean => {
  const trimmed = line.trim();
  return (
    trimmed === APPROVAL_PARTICIPATION_REQUIREMENT ||
    trimmed === LEGACY_APPROVAL_PARTICIPATION_REQUIREMENT
  );
};

/** Legacy fallback when `participationMode` is not stored on the activity document. */
export const inferParticipationModeFromRequirements = (
  requirements: string[] | null | undefined
): ParticipationMode => {
  const items = requirements ?? [];
  if (items.some((item) => item.trim() === RSVP_PARTICIPATION_REQUIREMENT)) {
    return 'rsvp';
  }
  if (items.some((item) => isApprovalRequirementLine(item))) {
    return 'approval';
  }
  return 'approval';
};

/** Stored field wins; requirements text is the migration fallback. */
export const resolveParticipationMode = (
  stored: unknown,
  requirements?: string[] | null
): ParticipationMode => {
  if (stored === 'rsvp' || stored === 'approval') return stored;
  return inferParticipationModeFromRequirements(requirements);
};

/** Private (link-only) plans always RSVP — no approval queue. */
export const resolveParticipationModeForJoinMode = (input: {
  joinMode: ActivityJoinMode;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
}): ParticipationMode => {
  if (input.joinMode === 'private') return 'rsvp';
  return resolveParticipationMode(input.participationMode, input.requirements);
};

/** Primary join CTA on activity detail and explore cards. */
export const activityJoinCtaLabel = (options: {
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  isFull?: boolean;
}): string => {
  const mode = resolveParticipationMode(options.participationMode, options.requirements);
  if (options.isFull) {
    return mode === 'rsvp' ? 'Activity full' : 'Join waitlist';
  }
  return mode === 'rsvp' ? "I'm going" : 'Request to join';
};
