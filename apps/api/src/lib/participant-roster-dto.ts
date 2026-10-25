import type { MemberMedicalSafetyDTO, ParticipantDTO } from '@uaetrail/shared-types';
import type { ActivityParticipant } from '../domain/types.js';

export const activityTimingHasEnded = (startAt: Date, endAt: Date | null): boolean => {
  const end = endAt ?? startAt;
  return end.getTime() <= Date.now();
};

type ParticipantUserFields = {
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  medicalSafety?: MemberMedicalSafetyDTO | null;
};

export const mapHostParticipantToDto = (
  participant: ActivityParticipant,
  user: ParticipantUserFields,
  activityEnded: boolean
): ParticipantDTO => {
  const attended = Boolean(participant.checkedInAt);
  const hostRating =
    participant.hostRatedAt && participant.hostRatingScore != null
      ? {
          score: participant.hostRatingScore,
          comment: participant.hostRatingComment,
          ratedAt: participant.hostRatedAt.toISOString(),
          rideshare: participant.hostRatingRideshare ?? null,
        }
      : null;

  return {
    id: participant.id,
    userId: participant.userId,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    medicalSafety: user.medicalSafety ?? undefined,
    checkedInAt: participant.checkedInAt?.toISOString(),
    joinedAt: participant.createdAt.toISOString(),
    status: attended ? 'attended' : 'going',
    hostRating,
    canConfirmAttendance: !attended,
    canRevoke: !attended,
    canRate: attended && !participant.hostRatedAt && activityEnded
  };
};
