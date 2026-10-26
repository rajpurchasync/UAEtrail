import type { ActivityDTO } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findPublishedActivityWithPreviewsById, listFeaturedPublishedActivities, listPublishedActivitiesWithPreviews } from '../lib/activities-store.js';
import { countPendingActivityInvitesForSenderOnActivity } from '../lib/activity-invites-store.js';
import { findActivityRequestByEventAndUser } from '../lib/activity-engagement-store.js';
import { buildActivityPresentationForDetail } from '../lib/build-activity-presentation.js';
import { buildActivityRedactedDetail } from '../lib/activity-redacted-detail.js';
import { resolveActivityDetailLinkage } from '../lib/activity-detail-linkage.js';
import { buildActivityDto, toLocationDto, toParticipantPreviews } from '../lib/mappers.js';
import { enrichActivityRideshareVehicleForCrew } from '../lib/rideshare-vehicle-crew.js';
import { canWithdrawRequest } from '../lib/withdraw-reasons.js';
import { PRIVATE_ACTIVITY_MESSAGE } from './activity-viewer-access.js';
import { resolveViewerPendingJoinInvite } from './activity-invite.js';
import { buildParticipationDto } from './checkin.js';
import { composeActivityViewerAccess } from './compose-activity-viewer-access.js';
import { resolveMemberStatus } from './member-status.js';

export const listFeaturedActivitiesPublic = async (limit: number): Promise<ActivityDTO[]> => {
  const events = await listFeaturedPublishedActivities(limit);
  return events.map((event) => buildActivityDto(event));
};

export const listPublishedActivitiesPublic = async (input: {
  page: number;
  pageSize: number;
  when: 'upcoming' | 'past' | 'all';
}) => {
  const { items: events, total } = await listPublishedActivitiesWithPreviews({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    when: input.when,
  });
  return {
    items: events.map((event) => buildActivityDto(event)),
    total,
  };
};

/** Public activity detail (`GET /activities/:id`). */
export const loadPublicActivityDetail = async (input: {
  activityId: string;
  viewerUserId: string | null;
  isPlatformAdmin: boolean;
}) => {
  const { activityId: id } = input;
  const event = await findPublishedActivityWithPreviewsById(id);

  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const viewerUserId = input.viewerUserId;
  const hostUserId = event.createdById ?? event.hostId ?? null;
  const participantUserIds = event.participants.map((row) => row.userId);
  const hostStatus = viewerUserId ? await resolveMemberStatus(viewerUserId) : null;

  const access = await composeActivityViewerAccess(
    {
      viewerUserId,
      activity: {
        id: event.id,
        tenantId: event.tenantId,
        hostId: event.hostId,
        createdById: event.createdById,
        joinMode: event.joinMode,
        requirements: event.requirements,
      },
      isPlatformAdmin: input.isPlatformAdmin,
    },
    { viewerUserId, hostStatus },
    viewerUserId ? { hostUserId, participantUserIds } : undefined
  );

  let myParticipation = null;
  let myRequest = null;
  let myJoinInvite = null;
  if (viewerUserId) {
    const mine = event.participants.find((p) => p.userId === viewerUserId);
    if (mine) {
      myParticipation = buildParticipationDto(event, mine);
    }
    const requestRow = await findActivityRequestByEventAndUser(id, viewerUserId);
    if (requestRow) {
      const status = requestRow.status.toLowerCase();
      myRequest = {
        id: requestRow.id,
        status,
        canWithdraw: canWithdrawRequest(status),
      };
    }
    if (!myParticipation) {
      myJoinInvite = await resolveViewerPendingJoinInvite(id, viewerUserId);
    }
  }

  const pendingJoinInviteCount =
    viewerUserId != null
      ? await countPendingActivityInvitesForSenderOnActivity({
          activityId: id,
          fromUserId: viewerUserId,
        })
      : 0;

  const presentation = buildActivityPresentationForDetail({
    event,
    viewerAccess: access,
    viewerUserId,
    myParticipation,
    myRequest: myRequest ? { status: myRequest.status, canWithdraw: myRequest.canWithdraw } : null,
    pendingJoinInviteCount,
  });

  if (access.exposure === 'none') {
    const guestListedSignIn =
      !viewerUserId && access.gateReason === 'sign_in' && access.joinMode !== 'private';
    return {
      data: guestListedSignIn
        ? {
            id: event.id,
            joinMode: event.joinMode,
            title: event.title,
            locationName: event.location.name,
            activityType: event.activityType,
            participationMode: event.participationMode,
            requirements: event.requirements,
          }
        : {
            id: event.id,
            joinMode: 'private',
            message: PRIVATE_ACTIVITY_MESSAGE,
          },
      viewerAccess: access,
      presentation: guestListedSignIn ? null : presentation,
    };
  }

  const linkage = await resolveActivityDetailLinkage(event, findPublishedActivityWithPreviewsById);

  if (access.exposure === 'redacted') {
    const redactedDto = await enrichActivityRideshareVehicleForCrew(
      buildActivityRedactedDetail(event),
      hostUserId,
      access.canAccessCrewSurfaces
    );
    return {
      data: {
        ...redactedDto,
        linkedParentActivity: linkage.linkedParentActivity,
        linkedRideshare: linkage.linkedRideshareSummary,
        myParticipation,
        myRequest,
        myJoinInvite,
      },
      viewerAccess: access,
      presentation,
    };
  }

  const activityDto = await enrichActivityRideshareVehicleForCrew(
    buildActivityDto(event),
    hostUserId,
    access.canAccessCrewSurfaces
  );

  return {
    data: {
      ...activityDto,
      linkedRideshare: linkage.linkedRideshare,
      linkedParentActivity: linkage.linkedParentActivity,
      organizerId: event.hostId ?? event.tenant.ownerId,
      participants: toParticipantPreviews(event.participants),
      location: toLocationDto(event.location),
      myParticipation,
      myRequest,
      myJoinInvite,
    },
    viewerAccess: access,
    presentation,
  };
};
