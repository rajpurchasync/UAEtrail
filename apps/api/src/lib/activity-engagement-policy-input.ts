import type {
  ActivityJoinMode,
  ActivityViewerAccessDTO,
  ResolveActivityEngagementPolicyInput,
} from '@uaetrail/shared-types';
import type { ParticipationMode } from '@uaetrail/shared-types';
import { ActivityStatus } from '../domain/enums.js';
import type { buildActivityDto } from './mappers.js';

type ActivityEventSource = Parameters<typeof buildActivityDto>[0];

/** Activity fields shared by map enrich and activity detail for L1 policy input. */
export type ActivityEngagementPolicyActivitySlice = {
  status?: string | null;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  rideshareEnabled?: boolean | null;
  linkedRideshareActivityId?: string | null;
  participants?: unknown[] | null;
};

export type BuildActivityEngagementPolicyInputArgs = {
  viewerAccess: ActivityViewerAccessDTO;
  isHostUser: boolean;
  activityPublished: boolean;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  rideshareEnabled?: boolean;
  linkedRideshareActivityId?: string | null;
  myParticipation?: unknown | null;
  myRequest?: { status: string; canWithdraw: boolean } | null;
  confirmedParticipantCount?: number;
  pendingJoinInviteCount?: number;
  previewMode?: boolean;
  isEmbedded?: boolean;
  joinMode?: ActivityJoinMode;
  joinRequestStatus?: 'pending' | 'waitlisted' | null;
};

/** Single L1 policy input bag — map peek, detail presentation, and tests. */
export const buildActivityEngagementPolicyInput = (
  args: BuildActivityEngagementPolicyInputArgs
): ResolveActivityEngagementPolicyInput => ({
  viewerAccess: args.viewerAccess,
  isHostUser: args.isHostUser,
  previewMode: args.previewMode ?? false,
  isEmbedded: args.isEmbedded ?? false,
  activityPublished: args.activityPublished,
  participationMode: args.participationMode,
  requirements: args.requirements,
  meetingLat: args.meetingLat ?? null,
  meetingLng: args.meetingLng ?? null,
  startLat: args.startLat ?? null,
  startLng: args.startLng ?? null,
  parkingLat: args.parkingLat ?? null,
  parkingLng: args.parkingLng ?? null,
  rideshareEnabled: Boolean(args.rideshareEnabled),
  linkedRideshareActivityId: args.linkedRideshareActivityId ?? null,
  myParticipation: args.myParticipation,
  myRequest: args.myRequest,
  confirmedParticipantCount: args.confirmedParticipantCount ?? 0,
  pendingJoinInviteCount: args.pendingJoinInviteCount ?? 0,
  joinMode: args.joinMode,
  joinRequestStatus: args.joinRequestStatus,
});

const sliceFromActivityEvent = (event: ActivityEventSource): ActivityEngagementPolicyActivitySlice => ({
  status: event.status,
  participationMode: event.participationMode,
  requirements: event.requirements,
  meetingLat: event.meetingLat ?? null,
  meetingLng: event.meetingLng ?? null,
  startLat: event.startLat ?? null,
  startLng: event.startLng ?? null,
  parkingLat: event.parkingLat ?? null,
  parkingLng: event.parkingLng ?? null,
  rideshareEnabled: event.rideshareEnabled,
  linkedRideshareActivityId: event.linkedRideshareActivityId ?? null,
  participants: event.participants,
});

const sliceFromMapActivity = (
  activity: NonNullable<import('@uaetrail/shared-types').ActivityDTO>
): ActivityEngagementPolicyActivitySlice => ({
  status: activity.status,
  participationMode: activity.participationMode,
  requirements: activity.requirements,
  meetingLat: activity.meetingLat ?? null,
  meetingLng: activity.meetingLng ?? null,
  startLat: activity.startLat ?? null,
  startLng: activity.startLng ?? null,
  parkingLat: activity.parkingLat ?? null,
  parkingLng: activity.parkingLng ?? null,
  rideshareEnabled: activity.rideshareEnabled,
  linkedRideshareActivityId: activity.linkedRideshareActivityId ?? null,
  participants: null,
});

const applyActivitySlice = (
  slice: ActivityEngagementPolicyActivitySlice,
  base: Omit<
    BuildActivityEngagementPolicyInputArgs,
    | 'participationMode'
    | 'requirements'
    | 'meetingLat'
    | 'meetingLng'
    | 'startLat'
    | 'startLng'
    | 'parkingLat'
    | 'parkingLng'
    | 'rideshareEnabled'
    | 'linkedRideshareActivityId'
    | 'activityPublished'
    | 'confirmedParticipantCount'
  > & { confirmedParticipantCount?: number }
): ResolveActivityEngagementPolicyInput =>
  buildActivityEngagementPolicyInput({
    ...base,
    activityPublished:
      slice.status === ActivityStatus.PUBLISHED ||
      slice.status === 'published' ||
      slice.status === 'PUBLISHED',
    participationMode: slice.participationMode,
    requirements: slice.requirements,
    meetingLat: slice.meetingLat,
    meetingLng: slice.meetingLng,
    startLat: slice.startLat,
    startLng: slice.startLng,
    parkingLat: slice.parkingLat,
    parkingLng: slice.parkingLng,
    rideshareEnabled: Boolean(slice.rideshareEnabled),
    linkedRideshareActivityId: slice.linkedRideshareActivityId ?? null,
    confirmedParticipantCount:
      base.confirmedParticipantCount ?? slice.participants?.length ?? 0,
  });

/** `GET /activities/:id` presentation pipeline. */
export const buildDetailEngagementPolicyInput = (input: {
  event: ActivityEventSource;
  viewerAccess: ActivityViewerAccessDTO;
  viewerUserId: string | null;
  myParticipation: unknown | null;
  myRequest: { status: string; canWithdraw: boolean } | null;
  previewMode?: boolean;
  isEmbedded?: boolean;
  pendingJoinInviteCount?: number;
}): ResolveActivityEngagementPolicyInput => {
  const hostUserId = input.event.createdById ?? input.event.hostId ?? null;
  const isHostUser = Boolean(input.viewerUserId && hostUserId && input.viewerUserId === hostUserId);
  return applyActivitySlice(sliceFromActivityEvent(input.event), {
    viewerAccess: input.viewerAccess,
    isHostUser,
    previewMode: input.previewMode,
    isEmbedded: input.isEmbedded,
    myParticipation: input.myParticipation,
    myRequest: input.myRequest,
    pendingJoinInviteCount: input.pendingJoinInviteCount,
  });
};

/** `GET /explore/map` per-viewer enrich for activity pins. */
export const buildMapPeekEngagementPolicyInput = (input: {
  viewerAccess: ActivityViewerAccessDTO;
  activity: NonNullable<import('@uaetrail/shared-types').ActivityDTO>;
  isHostUser: boolean;
  joinMode: ActivityJoinMode;
  joinRequestStatus: 'pending' | 'waitlisted' | null;
  onRoster: boolean;
  confirmedParticipantCount: number;
  pendingJoinInviteCount: number;
}): ResolveActivityEngagementPolicyInput =>
  applyActivitySlice(sliceFromMapActivity(input.activity), {
    viewerAccess: input.viewerAccess,
    isHostUser: input.isHostUser,
    joinMode: input.joinMode,
    joinRequestStatus: input.joinRequestStatus,
    myParticipation: input.onRoster ? { onRoster: true } : null,
    myRequest:
      input.joinRequestStatus != null
        ? { status: input.joinRequestStatus, canWithdraw: true }
        : null,
    confirmedParticipantCount: input.confirmedParticipantCount,
    pendingJoinInviteCount: input.pendingJoinInviteCount,
  });
