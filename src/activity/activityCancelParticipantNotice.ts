import {
  activityHasJoinedParticipants,
  type ActivityDTO,
  type ParticipantPreviewDTO,
} from '@uaetrail/shared-types';

/** Copy when cancelling/deleting an activity that already has joiners. */
export const activityCancelParticipantNotice = (
  activity: ActivityDTO,
  participantPreviews?: ParticipantPreviewDTO[] | null
): string | null => {
  const hasJoiners = activityHasJoinedParticipants({
    slotsAvailable: activity.slotsAvailable,
    slotsTotal: activity.slotsTotal,
    participantPreviews,
  });
  if (!hasJoiners) return null;

  let count = participantPreviews?.length ?? 0;
  if (activity.slotsTotal != null && activity.slotsAvailable != null) {
    count = Math.max(0, activity.slotsTotal - activity.slotsAvailable);
  }
  if (count <= 0) {
    return 'People who joined will be notified that this outing is cancelled.';
  }
  const noun = count === 1 ? 'person has' : 'people have';
  return `${count} ${noun} joined. They'll be notified that this outing is cancelled.`;
};

/** @deprecated Use {@link activityCancelParticipantNotice}. */
export const hostActivityCancelParticipantNotice = activityCancelParticipantNotice;
