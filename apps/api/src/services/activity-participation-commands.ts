import { ActivityStatus, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findPublishedActivityWithPreviewsById, findActivityForRequestViewById } from '../lib/activities-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import {
  applyAdultFamilyInviteAccepted,
  applyAdultFamilyInviteDeclined,
  cancelUserActivityRequestAndPromoteWaitlist,
  findActivityRequestByIdForUser,
  updateActivityRequestNote,
  updateActivityRequestParty,
} from '../lib/activity-engagement-store.js';
import {
  resolveJoinPartyFromBody,
  sendOutingInvitesForNewAdults,
} from './activity-party-attach.js';
import {
  findActivityFamilyInviteByToken,
  markActivityFamilyInviteResponded,
} from '../lib/activity-family-invites-store.js';
import { markNotificationsReadForCancelledJoinRequest } from '../lib/notifications-store.js';
import { canWithdrawRequest, withdrawReasonSchema } from '../lib/withdraw-reasons.js';
import type { z } from 'zod';

type WithdrawReason = z.infer<typeof withdrawReasonSchema>['reason'];
import { buildParticipationDto } from './checkin.js';
import { createJoinOrWaitlistRequest, createRsvpParticipation } from './join-request.js';
import {
  notifyParticipantJoinRequestSubmitted,
  notifyParticipantJoinRequestWithdrawn,
} from './join-request-notifications.js';
import { PRIVATE_ACTIVITY_MESSAGE } from './activity-viewer-access.js';
import { composeActivityViewerAccess } from './compose-activity-viewer-access.js';
import { resolveMemberStatus } from './member-status.js';
import { notifyHostOfRequestWithdrawal } from './request-notifications.js';

export const assertPrivateActivityJoinAllowed = async (input: {
  activityId: string;
  viewerUserId: string;
  isPlatformAdmin: boolean;
}): Promise<void> => {
  const event = await findPublishedActivityWithPreviewsById(input.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const hostStatus = await resolveMemberStatus(input.viewerUserId);
  const access = await composeActivityViewerAccess(
    {
      viewerUserId: input.viewerUserId,
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
    { viewerUserId: input.viewerUserId, hostStatus },
    {
      hostUserId: event.createdById ?? event.hostId ?? null,
      participantUserIds: event.participants.map((row) => row.userId),
    }
  );
  if (access.joinMode === 'private' && !access.canOpenDetailPage) {
    throw new ApiError(403, 'activity_invite_only', PRIVATE_ACTIVITY_MESSAGE);
  }
};

export const submitPublicActivityJoinRequest = async (input: {
  activityId: string;
  userId: string;
  isPlatformAdmin: boolean;
  note?: string | null;
  packingCheckedIds?: string[];
  packingSignature?: string;
  adults?: number;
  kids?: number;
  partyMemberIds?: string[];
  sourceTeamId?: string | null;
}) => {
  await assertPrivateActivityJoinAllowed({
    activityId: input.activityId,
    viewerUserId: input.userId,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const party = await resolveJoinPartyFromBody({
    actorUserId: input.userId,
    partyMemberIds: input.partyMemberIds,
    sourceTeamId: input.sourceTeamId,
    adults: input.adults,
    kids: input.kids,
  });

  const { request, waitlisted } = await createJoinOrWaitlistRequest({
    activityId: input.activityId,
    userId: input.userId,
    note: input.note ?? undefined,
    packingCheckedIds: input.packingCheckedIds,
    packingSignature: input.packingSignature,
    adults: party.adults,
    kids: party.kids,
    partyMembers: party.partyMembers,
    partyApprovalPending: party.partyApprovalPending,
    sourceTeamId: party.sourceTeamId,
  });

  if (party.partyMembers?.length) {
    const eventDoc = await findActivityDocInMongo(input.activityId);
    await sendOutingInvitesForNewAdults({
      activityId: input.activityId,
      requestId: request.id,
      invitedByUserId: input.userId,
      previous: [],
      next: party.partyMembers,
      activityTitle: eventDoc?.title?.trim() || 'outing',
    });
  }

  void notifyParticipantJoinRequestSubmitted({
    userId: input.userId,
    activityId: input.activityId,
    requestId: request.id,
    waitlisted,
  });

  return {
    id: request.id,
    activityId: request.activityId,
    userId: request.userId,
    status: request.status.toLowerCase(),
    waitlisted,
    note: request.note,
    hostNote: request.hostNote,
    adults: request.adults,
    kids: request.kids,
    partyMembers: request.partyMembers,
    partyApprovalPending: request.partyApprovalPending,
    sourceTeamId: request.sourceTeamId,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};

export const submitPublicActivityRsvp = async (input: {
  activityId: string;
  userId: string;
  isPlatformAdmin: boolean;
  note?: string | null;
  packingCheckedIds?: string[];
  packingSignature?: string;
  adults?: number;
  kids?: number;
  partyMemberIds?: string[];
  sourceTeamId?: string | null;
}) => {
  await assertPrivateActivityJoinAllowed({
    activityId: input.activityId,
    viewerUserId: input.userId,
    isPlatformAdmin: input.isPlatformAdmin,
  });

  const party = await resolveJoinPartyFromBody({
    actorUserId: input.userId,
    partyMemberIds: input.partyMemberIds,
    sourceTeamId: input.sourceTeamId,
    adults: input.adults,
    kids: input.kids,
  });

  const { request, participation, waitlisted } = await createRsvpParticipation({
    activityId: input.activityId,
    userId: input.userId,
    note: input.note ?? undefined,
    packingCheckedIds: input.packingCheckedIds,
    packingSignature: input.packingSignature,
    adults: party.adults,
    kids: party.kids,
    partyMembers: party.partyMembers,
    partyApprovalPending: party.partyApprovalPending,
    sourceTeamId: party.sourceTeamId,
  });

  if (party.partyMembers?.length) {
    const eventDoc = await findActivityDocInMongo(input.activityId);
    await sendOutingInvitesForNewAdults({
      activityId: input.activityId,
      requestId: request.id,
      invitedByUserId: input.userId,
      previous: [],
      next: party.partyMembers,
      activityTitle: eventDoc?.title?.trim() || 'outing',
    });
  }

  const requestDto = {
    id: request.id,
    activityId: request.activityId,
    userId: request.userId,
    status: request.status.toLowerCase(),
    waitlisted: Boolean(waitlisted),
    note: request.note,
    hostNote: request.hostNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };

  if (!participation) {
    return { request: requestDto, participation: null, waitlisted: true };
  }

  const eventDoc = await findActivityDocInMongo(input.activityId);
  const participationDto = eventDoc
    ? buildParticipationDto(eventDoc, participation)
    : buildParticipationDto(
        { startAt: new Date(), endAt: null, status: ActivityStatus.PUBLISHED },
        participation
      );

  return {
    request: requestDto,
    participation: participationDto,
    waitlisted: false,
  };
};

export const cancelPublicActivityJoinRequest = async (input: {
  requestId: string;
  userId: string;
  reason: WithdrawReason;
  message?: string | null;
}) => {
  const request = await findActivityRequestByIdForUser(input.requestId, input.userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  if (!canWithdrawRequest(request.status.toLowerCase())) {
    throw new ApiError(400, 'request_not_cancellable', 'This request cannot be cancelled.');
  }

  const wasConfirmed = request.status.toLowerCase() === 'approved';

  await cancelUserActivityRequestAndPromoteWaitlist({
    requestId: request.id,
    activityId: request.activityId,
    userId: input.userId,
    cancelReason: input.reason,
    cancelMessage: input.message?.trim() || null,
  });

  if (!wasConfirmed) {
    const activity = await findActivityForRequestViewById(request.activityId);
    const hostUserId = activity?.hostId ?? activity?.createdById;
    if (hostUserId) {
      void markNotificationsReadForCancelledJoinRequest({
        hostUserId,
        activityId: request.activityId,
        requestId: request.id,
      });
    }
  }

  void notifyHostOfRequestWithdrawal({
    wasConfirmed,
    activityId: request.activityId,
    requestId: request.id,
    participantUserId: input.userId,
    cancelReason: input.reason,
    cancelMessage: input.message?.trim() || null,
  });

  void notifyParticipantJoinRequestWithdrawn({
    userId: input.userId,
    activityId: request.activityId,
    requestId: request.id,
    wasConfirmed,
  });
};

const ACTIVE_EDIT_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.WAITLISTED,
  RequestStatus.APPROVED,
];

export const updatePublicActivityJoinRequestNote = async (input: {
  requestId: string;
  userId: string;
  note: string;
}) => {
  const request = await findActivityRequestByIdForUser(input.requestId, input.userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(400, 'request_not_editable', 'Only pending requests can be updated.');
  }
  const updated = await updateActivityRequestNote(request.id, input.note);
  return { id: updated.id, note: updated.note };
};

export const updatePublicActivityJoinRequestParty = async (input: {
  requestId: string;
  userId: string;
  note?: string;
  adults?: number;
  kids?: number;
  partyMemberIds?: string[];
  sourceTeamId?: string | null;
}) => {
  const request = await findActivityRequestByIdForUser(input.requestId, input.userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  if (!ACTIVE_EDIT_STATUSES.includes(request.status)) {
    throw new ApiError(400, 'request_not_editable', 'This request cannot be updated.');
  }
  if (
    input.note === undefined &&
    input.adults === undefined &&
    input.kids === undefined &&
    input.partyMemberIds === undefined
  ) {
    throw new ApiError(400, 'nothing_to_update', 'No party details to update.');
  }

  let partyMembers = request.partyMembers;
  let adults = input.adults;
  let kids = input.kids;
  let sourceTeamId: string | null | undefined = input.sourceTeamId;
  let deferHostApproval = false;

  if (input.partyMemberIds !== undefined) {
    const party = await resolveJoinPartyFromBody({
      actorUserId: input.userId,
      partyMemberIds: input.partyMemberIds,
      sourceTeamId: input.sourceTeamId ?? request.sourceTeamId,
      adults: input.adults,
      kids: input.kids,
    });
    partyMembers = party.partyMembers;
    adults = party.adults;
    kids = party.kids;
    sourceTeamId = party.sourceTeamId;
    deferHostApproval = party.deferHostApproval;
  }

  const eventDoc =
    input.partyMemberIds !== undefined
      ? await findActivityDocInMongo(request.activityId)
      : undefined;

  const updated = await updateActivityRequestParty(request.id, {
    note: input.note,
    adults,
    kids,
    partyMembers,
    sourceTeamId,
    deferHostApproval,
    eventDoc: eventDoc ?? undefined,
  });

  if (input.partyMemberIds !== undefined && partyMembers) {
    await sendOutingInvitesForNewAdults({
      activityId: request.activityId,
      requestId: request.id,
      invitedByUserId: input.userId,
      previous: request.partyMembers,
      next: partyMembers,
      activityTitle: eventDoc?.title?.trim() || 'outing',
    });
  }

  return {
    id: updated.id,
    note: updated.note,
    adults: updated.adults,
    kids: updated.kids,
    partyMembers: updated.partyMembers,
    partyApprovalPending: updated.partyApprovalPending,
    sourceTeamId: updated.sourceTeamId,
  };
};

export const acceptActivityFamilyOutingInvite = async (input: {
  token: string;
  userId: string;
}) => {
  const invite = await findActivityFamilyInviteByToken(input.token);
  if (!invite) {
    throw new ApiError(404, 'invite_not_found', 'Family outing invite not found or already used.');
  }
  if (invite.inviteeUserId !== input.userId) {
    throw new ApiError(403, 'forbidden', 'This invite belongs to a different account.');
  }
  const marked = await markActivityFamilyInviteResponded(invite.id, 'accepted');
  if (!marked) {
    throw new ApiError(400, 'invite_not_pending', 'Invite is no longer pending.');
  }
  const updated = await applyAdultFamilyInviteAccepted({
    requestId: invite.requestId,
    membershipId: invite.membershipId,
  });
  return {
    activityId: invite.activityId,
    requestId: invite.requestId,
    partyMembers: updated.partyMembers,
    partyApprovalPending: updated.partyApprovalPending,
  };
};

export const declineActivityFamilyOutingInvite = async (input: {
  token: string;
  userId: string;
}) => {
  const invite = await findActivityFamilyInviteByToken(input.token);
  if (!invite) {
    throw new ApiError(404, 'invite_not_found', 'Family outing invite not found or already used.');
  }
  if (invite.inviteeUserId !== input.userId) {
    throw new ApiError(403, 'forbidden', 'This invite belongs to a different account.');
  }
  const marked = await markActivityFamilyInviteResponded(invite.id, 'declined');
  if (!marked) {
    throw new ApiError(400, 'invite_not_pending', 'Invite is no longer pending.');
  }
  const updated = await applyAdultFamilyInviteDeclined({
    requestId: invite.requestId,
    membershipId: invite.membershipId,
  });
  return {
    activityId: invite.activityId,
    requestId: invite.requestId,
    partyMembers: updated.partyMembers,
  };
};
