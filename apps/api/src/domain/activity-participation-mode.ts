import {
  inferParticipationModeFromRequirements,
  resolveParticipationMode,
  type ParticipationMode,
} from '@uaetrail/shared-types';

export type { ParticipationMode };
export { inferParticipationModeFromRequirements, resolveParticipationMode };

export const normalizeParticipationMode = (value: unknown): ParticipationMode =>
  value === 'rsvp' ? 'rsvp' : 'approval';
