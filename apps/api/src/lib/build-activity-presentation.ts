import {
  resolveActivityEngagementPolicy,
  type ActivityPresentationDTO,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { ActivityStatus } from '../domain/enums.js';
import type { buildActivityDto } from './mappers.js';

type ActivityEventSource = Parameters<typeof buildActivityDto>[0];

export const buildActivityPresentationForDetail = (input: {
  event: ActivityEventSource;
  viewerAccess: ActivityViewerAccessDTO;
  viewerUserId: string | null;
  myParticipation: unknown | null;
  myRequest: { status: string; canWithdraw: boolean } | null;
  previewMode?: boolean;
  isEmbedded?: boolean;
}): ActivityPresentationDTO => {
  const hostUserId = input.event.createdById ?? input.event.hostId ?? null;
  const isHostUser = Boolean(input.viewerUserId && hostUserId && input.viewerUserId === hostUserId);

  return resolveActivityEngagementPolicy({
    viewerAccess: input.viewerAccess,
    isHostUser,
    previewMode: input.previewMode ?? false,
    isEmbedded: input.isEmbedded ?? false,
    activityPublished: input.event.status === ActivityStatus.PUBLISHED,
    participationMode: input.event.participationMode,
    requirements: input.event.requirements,
    meetingLat: input.event.meetingLat ?? null,
    meetingLng: input.event.meetingLng ?? null,
    startLat: input.event.startLat ?? null,
    startLng: input.event.startLng ?? null,
    parkingLat: input.event.parkingLat ?? null,
    parkingLng: input.event.parkingLng ?? null,
    rideshareEnabled: Boolean(input.event.rideshareEnabled),
    linkedRideshareActivityId: input.event.linkedRideshareActivityId ?? null,
    myParticipation: input.myParticipation,
    myRequest: input.myRequest,
    confirmedParticipantCount: input.event.participants?.length ?? 0,
  }).presentation;
};
