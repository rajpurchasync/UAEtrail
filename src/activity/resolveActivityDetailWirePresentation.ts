import {
  activityIsConsumerDiscoverable,
  mapPeekJoinRequestStatusFromUiKind,
  resolveActivityEngagementPolicy,
  type ActivityDetailDTO,
  type ActivityPresentationDTO,
  type ActivityViewerAccessDTO,
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
    | 'participantPreviews'
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

/**
 * Prefer API `presentation`, but backfill fields the client resolver always knows
 * (e.g. `consumerLayout` when an older API build omitted it).
 */
export const mergeActivityDetailWirePresentation = (
  fromApi:
    | (Omit<ActivityPresentationDTO, 'sections'> & {
        sections?: ActivityPresentationDTO['sections'];
      })
    | null
    | undefined,
  resolved: ActivityPresentationDTO | null
): ActivityPresentationDTO | null => {
  if (fromApi?.sections) {
    return {
      ...fromApi,
      sections: fromApi.sections,
      engagement: fromApi.engagement ?? resolved?.engagement,
      tabs: fromApi.tabs ?? resolved?.tabs,
      footerByTab: fromApi.footerByTab ?? resolved?.footerByTab,
      consumerLayout: fromApi.consumerLayout ?? resolved?.consumerLayout,
      strips: fromApi.strips ?? resolved?.strips,
    } as ActivityPresentationDTO;
  }
  if (fromApi) return null;
  return resolved;
};

/** L1 `presentation` envelope when GET detail omits wire (preview, optimistic paths). */
export const resolveActivityDetailWirePresentation = (
  input: ResolveActivityDetailWirePresentationInput
): ActivityPresentationDTO | null => {
  if (!input.viewerAccess) return null;

  const linkedRideshareActivityId =
    input.activity.linkedRideshare?.id ?? input.activity.linkedParentActivity?.id ?? null;

  const policy = resolveActivityEngagementPolicy({
    viewerAccess: input.viewerAccess,
    isHostUser: input.isHostUser,
    previewMode: input.previewMode ?? false,
    isEmbedded: input.isEmbedded ?? false,
    activityPublished: activityIsConsumerDiscoverable(input.activity.status),
    participationMode: input.activity.participationMode,
    requirements: input.activity.requirements,
    joinMode: input.activity.joinMode,
    joinRequestStatus: mapPeekJoinRequestStatusFromUiKind(input.joinUiState),
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
    participantPreviewCount: input.activity.participantPreviews?.length ?? 0,
  });

  return {
    ...policy.presentation,
    strips: policy.strips,
  };
};
