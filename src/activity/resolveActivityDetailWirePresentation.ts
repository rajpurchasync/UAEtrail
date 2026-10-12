import {
  resolveActivityEngagementPolicy,
  type ActivityDetailDTO,
  type ActivityPresentationDTO,
  type ActivityViewerAccessDTO,
  type MapPeekJoinRequestStatus,
} from '@uaetrail/shared-types';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ResolveActivityDetailWirePresentationInput = {
  activity: Pick<
    ActivityDetailDTO,
    | 'status'
    | 'participationMode'
    | 'requirements'
    | 'meetingLat'
    | 'meetingLng'
    | 'startLat'
    | 'startLng'
    | 'parkingLat'
    | 'parkingLng'
    | 'rideshareEnabled'
    | 'linkedRideshare'
    | 'linkedParentActivity'
    | 'participants'
    | 'joinMode'
  >;
  viewerAccess: ActivityViewerAccessDTO | null;
  isHostUser: boolean;
  previewMode?: boolean;
  isEmbedded?: boolean;
  joinUiState: JoinRequestUiState;
  myParticipation?: unknown | null;
  myRequest?: { status: string; canWithdraw: boolean } | null;
};

const joinRequestStatusFromUi = (
  joinUiState: JoinRequestUiState
): MapPeekJoinRequestStatus | null => {
  if (joinUiState.kind !== 'pending') return null;
  return joinUiState.status === 'waitlisted' ? 'waitlisted' : 'pending';
};

/** L1 `presentation` envelope when GET detail omits wire (preview, optimistic paths). */
export const resolveActivityDetailWirePresentation = (
  input: ResolveActivityDetailWirePresentationInput
): ActivityPresentationDTO | null => {
  if (!input.viewerAccess) return null;

  const linkedRideshareActivityId =
    input.activity.linkedRideshare?.id ?? input.activity.linkedParentActivity?.id ?? null;

  return resolveActivityEngagementPolicy({
    viewerAccess: input.viewerAccess,
    isHostUser: input.isHostUser,
    previewMode: input.previewMode ?? false,
    isEmbedded: input.isEmbedded ?? false,
    activityPublished: input.activity.status === 'published',
    participationMode: input.activity.participationMode,
    requirements: input.activity.requirements,
    joinMode: input.activity.joinMode,
    joinRequestStatus: joinRequestStatusFromUi(input.joinUiState),
    meetingLat: input.activity.meetingLat ?? null,
    meetingLng: input.activity.meetingLng ?? null,
    startLat: input.activity.startLat ?? null,
    startLng: input.activity.startLng ?? null,
    parkingLat: input.activity.parkingLat ?? null,
    parkingLng: input.activity.parkingLng ?? null,
    rideshareEnabled: Boolean(input.activity.rideshareEnabled),
    linkedRideshareActivityId,
    myParticipation: input.myParticipation ?? null,
    myRequest: input.myRequest ?? null,
    confirmedParticipantCount: input.activity.participants?.length ?? 0,
  }).presentation;
};
