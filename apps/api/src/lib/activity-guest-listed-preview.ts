import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { buildActivityDto, toParticipantPreviews } from './mappers.js';

type ActivityEventSource = Parameters<typeof buildActivityDto>[0];

type ParticipantWithUser = Parameters<typeof toParticipantPreviews>[0][number];

/** Public hero + key-facts fields for listed outings — same chrome as signed-in; body stays gated on the client. */
export const buildActivityGuestListedPreviewDetail = (event: ActivityEventSource): ActivityDetailDTO => {
  const dto = buildActivityDto(event);
  const participantsWithUser = (event.participants ?? []).filter(
    (p): p is ParticipantWithUser =>
      typeof p === 'object' && p != null && 'userId' in p && 'user' in p && Boolean(p.user)
  );

  return {
    ...dto,
    description: dto.description ?? null,
    participantPreviews:
      participantsWithUser.length > 0 ? toParticipantPreviews(participantsWithUser) : dto.participantPreviews,
  };
};
