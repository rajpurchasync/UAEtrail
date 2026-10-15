import type { ParticipantIntentDTO } from '@uaetrail/shared-types';

/** Published seeking activity id for manage / transport surfaces (M0). */
export const resolveParticipantIntentActivityId = (
  intent: ParticipantIntentDTO | null | undefined
): string | null => {
  if (!intent) return null;
  const id = intent.activityId ?? intent.seekingActivityId ?? null;
  return id?.trim() ? id.trim() : null;
};
