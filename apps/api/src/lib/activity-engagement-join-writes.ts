import { resolveActivityPartyHeadcount } from '@uaetrail/shared-types';
import {
  ActivityStatus,
  NotificationType,
  RequestStatus,
} from '../domain/enums.js';
import type { ActivityRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { newEntityId } from './entity-builders.js';
import {
  findActivityDocInMongo,
  incrementActivityCounts,
  releaseActivityParticipantSlots,
  tryReserveActivityParticipantSlots,
} from './entity-sync.js';
import { myRequestDetailPath } from './member-routes.js';
import { dispatchNotification } from '../services/notifications.js';
import {
  addParticipantToActivityGroupChat,
} from '../services/activity-group-chat.js';
import { resolveParticipationMode } from '../domain/activity-participation-mode.js';
import { assertParticipantMeetsWomenOnlyRequirement } from '../domain/activity-audience-requirements.js';
import { assertPartyKidsAllowed } from '../domain/activity-party-join.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import {
  ACTIVE_STATUSES,
  activityParticipantsCollection,
  activityRequestsCollection,
  isActivityFull,
  loadPublishedEventForJoin,
  patchActivityRequestInMongo,
  persistJoinRequestRow,
  stripPartyLineFromNote,
  toActivityRequestRecord,
  withPartyNote,
  type MongoPartyMember,
} from './activity-engagement-store-internals.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from './activity-engagement-store-reads.js';

export async function createJoinOrWaitlistRequest(opts: {
  activityId: string;
  userId: string;
  note?: string;
  packingCheckedIds?: string[];
  packingSignature?: string;
  adults?: number;
  kids?: number;
  partyMembers?: MongoPartyMember[];
  partyApprovalPending?: boolean;
  sourceTeamId?: string | null;
}) {
  const event = await loadPublishedEventForJoin(opts.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  if (event.participationMode === 'rsvp') {
    throw new ApiError(
      400,
      'use_rsvp_endpoint',
      'This activity uses open RSVP. Tap I\'m going instead.'
    );
  }

  if (event.hostId === opts.userId || event.createdById === opts.userId) {
    throw new ApiError(400, 'host_cannot_join', 'Hosts cannot join their own activity.');
  }

  await assertParticipantMeetsWomenOnlyRequirement(opts.userId, event.requirements);
  const { assertMemberMedicalSafetyForJoin } = await import('./member-medical-safety-profile.js');
  await assertMemberMedicalSafetyForJoin(opts.userId);
  const { assertPackingAckForJoin, composePackingJoinNote } = await import(
    '../domain/activity-packing-ack.js'
  );
  assertPackingAckForJoin({
    requirements: event.requirements,
    packingCheckedIds: opts.packingCheckedIds,
    packingSignature: opts.packingSignature,
  });
  const joinNote = composePackingJoinNote({
    requirements: event.requirements,
    packingCheckedIds: opts.packingCheckedIds,
    packingSignature: opts.packingSignature,
    note: opts.note,
  });

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);

  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
  }

  assertPartyKidsAllowed(opts.kids ?? 0, event.requirements, event.audience?.kidsWelcome);

  const waitlisted = isActivityFull(event.capacity, event.participantSlotsUsed);
  if (waitlisted && event.waitlist === false) {
    throw new ApiError(400, 'activity_full', 'This activity is full.');
  }
  const status = waitlisted ? RequestStatus.WAITLISTED : RequestStatus.PENDING;
  const request = await persistJoinRequestRow({
    requestId: existing?.id ?? newEntityId(),
    activityId: opts.activityId,
    userId: opts.userId,
    status,
    note: withPartyNote(joinNote ?? existing?.note ?? null, opts.adults, opts.kids),
    adults: opts.adults,
    kids: opts.kids,
    partyMembers: opts.partyMembers,
    partyApprovalPending: opts.partyApprovalPending,
    sourceTeamId: opts.sourceTeamId,
    existingCreatedAt: existing?.createdAt,
  });

  await incrementActivityCounts(
    opts.activityId,
    waitlisted ? { waitlisted: 1 } : { pending: 1 }
  );

  return { request, waitlisted };
}

export async function createRsvpParticipation(opts: {
  activityId: string;
  userId: string;
  note?: string;
  packingCheckedIds?: string[];
  packingSignature?: string;
  adults?: number;
  kids?: number;
  partyMembers?: MongoPartyMember[];
  partyApprovalPending?: boolean;
  sourceTeamId?: string | null;
}) {
  const event = await loadPublishedEventForJoin(opts.activityId);
  if (!event) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  if (event.participationMode !== 'rsvp') {
    throw new ApiError(
      400,
      'approval_required',
      'This activity requires host approval. Submit a join request instead.'
    );
  }

  if (event.hostId === opts.userId || event.createdById === opts.userId) {
    throw new ApiError(400, 'host_cannot_join', 'Hosts cannot RSVP to their own activity.');
  }

  await assertParticipantMeetsWomenOnlyRequirement(opts.userId, event.requirements);
  const { assertMemberMedicalSafetyForJoin } = await import('./member-medical-safety-profile.js');
  await assertMemberMedicalSafetyForJoin(opts.userId);
  const { assertPackingAckForJoin, composePackingJoinNote } = await import(
    '../domain/activity-packing-ack.js'
  );
  assertPackingAckForJoin({
    requirements: event.requirements,
    packingCheckedIds: opts.packingCheckedIds,
    packingSignature: opts.packingSignature,
  });
  const joinNote = composePackingJoinNote({
    requirements: event.requirements,
    packingCheckedIds: opts.packingCheckedIds,
    packingSignature: opts.packingSignature,
    note: opts.note,
  });

  const existingParticipant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (existingParticipant) {
    throw new ApiError(409, 'already_joined', 'You are already going to this activity.');
  }

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);
  if (existing && existing.status === RequestStatus.APPROVED) {
    throw new ApiError(409, 'already_joined', 'You are already going to this activity.');
  }
  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
  }

  assertPartyKidsAllowed(opts.kids ?? 0, event.requirements, event.audience?.kidsWelcome);

  if (isActivityFull(event.capacity, event.participantSlotsUsed)) {
    if (event.waitlist === false) {
      throw new ApiError(400, 'activity_full', 'This activity is full.');
    }
    const request = await persistJoinRequestRow({
      requestId: existing?.id ?? newEntityId(),
      activityId: opts.activityId,
      userId: opts.userId,
      status: RequestStatus.WAITLISTED,
      note: withPartyNote(joinNote ?? existing?.note ?? null, opts.adults, opts.kids),
      adults: opts.adults,
      kids: opts.kids,
      partyMembers: opts.partyMembers,
      partyApprovalPending: opts.partyApprovalPending,
      sourceTeamId: opts.sourceTeamId,
      existingCreatedAt: existing?.createdAt,
    });
    await incrementActivityCounts(opts.activityId, { waitlisted: 1 });
    return { request, participation: null, waitlisted: true };
  }

  const partyHeadcount = resolveActivityPartyHeadcount(opts.adults, opts.kids);
  const reserved = await tryReserveActivityParticipantSlots(
    opts.activityId,
    partyHeadcount,
    ActivityStatus.PUBLISHED
  );
  if (!reserved) {
    throw new ApiError(400, 'activity_full', 'This activity is full.');
  }

  const requestId = existing?.id ?? newEntityId();
  const participantId = newEntityId();
  const now = new Date();
  const reviewerId = event.hostId ?? event.createdById;

  try {
    await activityRequestsCollection().updateOne(
      { _id: requestId },
      {
        $set: {
          activityId: opts.activityId,
          userId: opts.userId,
          status: RequestStatus.APPROVED,
          note: withPartyNote(joinNote ?? existing?.note ?? null, opts.adults, opts.kids),
          adults: opts.adults ?? 1,
          kids: opts.kids ?? 0,
          ...(opts.partyMembers !== undefined ? { partyMembers: opts.partyMembers } : {}),
          ...(opts.partyApprovalPending !== undefined
            ? { partyApprovalPending: opts.partyApprovalPending }
            : {}),
          ...(opts.sourceTeamId !== undefined ? { sourceTeamId: opts.sourceTeamId } : {}),
          hostNote: null,
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex: null,
          reviewedAt: now,
          reviewedById: reviewerId,
          updatedAt: now,
          createdAt: existing?.createdAt ?? now
        }
      },
      { upsert: true }
    );

    await activityParticipantsCollection().updateOne(
      { activityId: opts.activityId, userId: opts.userId },
      {
        $set: {
          activityId: opts.activityId,
          requestId,
          userId: opts.userId,
          approvedById: reviewerId,
          checkedInAt: null,
        },
        $setOnInsert: {
          _id: participantId,
          createdAt: now,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    await releaseActivityParticipantSlots(opts.activityId, partyHeadcount);
    throw error;
  }

  const mongoRow = await activityRequestsCollection().findOne({ _id: requestId });
  if (!mongoRow) {
    throw new ApiError(500, 'request_persist_failed', 'Failed to persist RSVP.');
  }

  const participant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (!participant) {
    throw new ApiError(500, 'participation_persist_failed', 'Failed to persist RSVP participation.');
  }

  scheduleSideEffect(
    addParticipantToActivityGroupChat({
      activityId: opts.activityId,
      userId: opts.userId,
    }),
    'engagement.rsvp_add_group_chat'
  );

  return {
    request: toActivityRequestRecord(mongoRow),
    participation: participant,
    waitlisted: false,
  };
}

/** Promote oldest waitlisted request to pending when a slot opens. */
export async function promoteNextWaitlisted(activityId: string): Promise<boolean> {
  const eventDoc = await findActivityDocInMongo(activityId);
  if (!eventDoc) return false;

  const slotsUsed =
    typeof eventDoc.participantSlotsUsed === 'number'
      ? eventDoc.participantSlotsUsed
      : await activityParticipantsCollection().countDocuments({ activityId });
  if (isActivityFull(eventDoc.capacity, slotsUsed)) {
    return false;
  }

  const next = await activityRequestsCollection().findOne(
    { activityId, status: RequestStatus.WAITLISTED },
    { sort: { createdAt: 1 } }
  );
  if (!next) return false;

  const rsvp = resolveParticipationMode(eventDoc.participationMode, eventDoc.requirements) === 'rsvp';
  if (rsvp) {
    const headcount = resolveActivityPartyHeadcount(next.adults, next.kids);
    const reserved = await tryReserveActivityParticipantSlots(
      activityId,
      headcount,
      ActivityStatus.PUBLISHED
    );
    if (!reserved) return false;
    const reviewerId = eventDoc.hostId ?? eventDoc.createdById ?? next.userId;
    const now = new Date();
    try {
      await patchActivityRequestInMongo(next._id, {
        status: RequestStatus.APPROVED,
        reviewedAt: now,
        reviewedById: reviewerId,
      });
      await activityParticipantsCollection().updateOne(
        { activityId, userId: next.userId },
        {
          $set: {
            activityId,
            requestId: next._id,
            userId: next.userId,
            approvedById: reviewerId,
            checkedInAt: null,
          },
          $setOnInsert: { _id: newEntityId(), createdAt: now },
        },
        { upsert: true }
      );
    } catch (error) {
      await releaseActivityParticipantSlots(activityId, headcount);
      throw error;
    }
    await incrementActivityCounts(activityId, { waitlisted: -1 });
    scheduleSideEffect(
      addParticipantToActivityGroupChat({ activityId, userId: next.userId }),
      'engagement.waitlist_promote_rsvp_chat'
    );
    await dispatchNotification({
      userId: next.userId,
      title: "You're going!",
      body: 'A waitlist spot opened and you are now confirmed on this outing.',
      type: NotificationType.REQUEST_UPDATE,
      meta: {
        kind: 'join_request_approved',
        activityId,
        requestId: String(next._id),
        path: myRequestDetailPath(String(next._id)),
      },
    });
    return true;
  }

  await patchActivityRequestInMongo(next._id, { status: RequestStatus.PENDING });
  await incrementActivityCounts(activityId, { waitlisted: -1, pending: 1 });

  await dispatchNotification({
    userId: next.userId,
    title: 'A spot opened up!',
    body: 'Your waitlisted activity now has availability. Your request is pending host approval.',
    type: NotificationType.REQUEST_UPDATE,
    meta: {
      kind: 'join_request_pending',
      activityId,
      requestId: String(next._id),
      path: myRequestDetailPath(String(next._id)),
    },
  });

  return true;
}

export const updateActivityRequestNote = async (id: string, note: string): Promise<ActivityRequest> => {
  await patchActivityRequestInMongo(id, { note });
  const mongoRow = await activityRequestsCollection().findOne({ _id: id });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toActivityRequestRecord({ ...mongoRow, note });
};

export const updateActivityRequestParty = async (
  id: string,
  input: {
    note?: string;
    adults?: number;
    kids?: number;
    partyMembers?: MongoPartyMember[];
    sourceTeamId?: string | null;
    /** When true, skip auto host-pending for new kids (adult invite flow owns the flag). */
    deferHostApproval?: boolean;
    /** Caller-preloaded activity doc — avoids a second activity find on the PATCH path. */
    eventDoc?: Awaited<ReturnType<typeof findActivityDocInMongo>>;
  }
): Promise<ActivityRequest> => {
  const mongoRow = await activityRequestsCollection().findOne({ _id: id });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  const partyMembers = input.partyMembers ?? mongoRow.partyMembers;
  const adults = input.adults ?? mongoRow.adults ?? 1;
  const kids = input.kids ?? mongoRow.kids ?? 0;
  const eventDoc = input.eventDoc ?? (await findActivityDocInMongo(mongoRow.activityId));
  if (!eventDoc) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  assertPartyKidsAllowed(kids, eventDoc.requirements ?? [], eventDoc.audience?.kidsWelcome);

  const priorHeadcount = resolveActivityPartyHeadcount(mongoRow.adults, mongoRow.kids);
  const nextHeadcount = resolveActivityPartyHeadcount(adults, kids);
  const delta = nextHeadcount - priorHeadcount;

  let partyApprovalPending = Boolean(mongoRow.partyApprovalPending);
  if (mongoRow.status === RequestStatus.APPROVED && delta !== 0) {
    if (delta > 0) {
      const reserved = await tryReserveActivityParticipantSlots(
        mongoRow.activityId,
        delta,
        ActivityStatus.PUBLISHED
      );
      if (!reserved) {
        throw new ApiError(400, 'activity_full', 'Not enough spots left for this group size.');
      }
      // RSVP outings auto-apply; approval outings flag host when headcount grows without deferred invite flow.
      const mode = resolveParticipationMode(
        eventDoc.participationMode,
        eventDoc.requirements ?? []
      );
      if (mode === 'approval' && !input.deferHostApproval) {
        partyApprovalPending = true;
      }
    } else {
      await releaseActivityParticipantSlots(mongoRow.activityId, Math.abs(delta));
      if (resolveActivityPartyHeadcount(adults, kids) <= 1) {
        partyApprovalPending = false;
      }
    }
  }

  const noteBase =
    input.note !== undefined ? input.note.trim() || null : stripPartyLineFromNote(mongoRow.note ?? null);
  const note = withPartyNote(noteBase, adults, kids);
  const next = await activityRequestsCollection().findOneAndUpdate(
    { _id: id },
    {
      $set: {
        note,
        adults,
        kids,
        ...(partyMembers !== undefined ? { partyMembers } : {}),
        ...(input.sourceTeamId !== undefined ? { sourceTeamId: input.sourceTeamId } : {}),
        partyApprovalPending,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );
  if (!next) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toActivityRequestRecord(next);
};

/** After an adult accepts a family outing invite — escalate host approval or confirm. */
export const applyAdultFamilyInviteAccepted = async (input: {
  requestId: string;
  membershipId: string;
}): Promise<ActivityRequest> => {
  const mongoRow = await activityRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  const partyMembers = [...(mongoRow.partyMembers ?? [])];
  const idx = partyMembers.findIndex((row) => row.membershipId === input.membershipId);
  if (idx < 0) {
    throw new ApiError(404, 'party_member_not_found', 'Family member not on this outing.');
  }
  const eventDoc = await findActivityDocInMongo(mongoRow.activityId);
  if (!eventDoc) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const mode = resolveParticipationMode(eventDoc.participationMode, eventDoc.requirements ?? []);
  const nextStatus =
    mongoRow.status === RequestStatus.APPROVED && mode === 'approval'
      ? 'host_pending'
      : 'confirmed';
  partyMembers[idx] = { ...partyMembers[idx]!, status: nextStatus };
  const partyApprovalPending =
    nextStatus === 'host_pending' ? true : Boolean(mongoRow.partyApprovalPending);
  const next = await activityRequestsCollection().findOneAndUpdate(
    { _id: input.requestId },
    { $set: { partyMembers, partyApprovalPending, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!next) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toActivityRequestRecord(next);
};

export const applyAdultFamilyInviteDeclined = async (input: {
  requestId: string;
  membershipId: string;
}): Promise<ActivityRequest> => {
  const mongoRow = await activityRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  const prior = mongoRow.partyMembers ?? [];
  const removed = prior.find((row) => row.membershipId === input.membershipId);
  const partyMembers = prior.filter((row) => row.membershipId !== input.membershipId);
  const { adults, kids } = (() => {
    const familyAdults = partyMembers.filter(
      (row) => row.memberType === 'adult' && row.status !== 'declined'
    ).length;
    const kidCount = partyMembers.filter(
      (row) => row.memberType === 'kid' && row.status !== 'declined'
    ).length;
    return { adults: 1 + familyAdults, kids: kidCount };
  })();
  const priorHeadcount = resolveActivityPartyHeadcount(mongoRow.adults, mongoRow.kids);
  const nextHeadcount = resolveActivityPartyHeadcount(adults, kids);
  const delta = nextHeadcount - priorHeadcount;
  if (delta < 0 && removed) {
    await releaseActivityParticipantSlots(mongoRow.activityId, Math.abs(delta));
  }
  const note = withPartyNote(stripPartyLineFromNote(mongoRow.note ?? null), adults, kids);
  let partyApprovalPending = Boolean(mongoRow.partyApprovalPending);
  if (nextHeadcount <= 1) partyApprovalPending = false;
  const next = await activityRequestsCollection().findOneAndUpdate(
    { _id: input.requestId },
    {
      $set: {
        partyMembers,
        adults,
        kids,
        note,
        partyApprovalPending,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );
  if (!next) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toActivityRequestRecord(next);
};