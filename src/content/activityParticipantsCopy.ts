/** Activity roster — `ActivityDetailDTO.participants` / host `ParticipantDTO` (not join-status “going”). */
export const ACTIVITY_PARTICIPANTS_SECTION_LABEL = 'Participants';
export const ACTIVITY_PARTICIPANTS_EMPTY_LABEL = 'No participants yet.';
export const ACTIVITY_PARTICIPANTS_HOST_MANAGE_HINT = 'Tap to view and manage the roster.';

export const activityCrewPendingReviewLabel = (count: number): string =>
  count === 1 ? '1 request to review' : `${count} requests to review`;
