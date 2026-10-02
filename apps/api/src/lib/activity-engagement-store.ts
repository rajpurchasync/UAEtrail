import type { Collection } from 'mongodb';
import {
  ActivityStatus,
  NotificationType,
  RequestStatus,
  type MembershipRole
} from '../domain/enums.js';
import type { ActivityParticipant, ActivityRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { findAuthUsersByIds } from './auth-users.js';
import { newEntityId } from './entity-builders.js';
import {
  findActivityDocInMongo,
  findLocationInMongo,
  patchActivityInMongo,
  releaseActivityParticipantSlot,
  tryReserveActivityParticipantSlot
} from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { parseStoredPricePackages } from './activity-pricing.js';
import { myRequestDetailPath } from './member-routes.js';
import { dispatchNotification } from '../services/notifications.js';
import { addParticipantToActivityGroupChat, removeParticipantFromActivityGroupChat } from '../services/activity-group-chat.js';
import { resolveParticipationMode } from '../domain/activity-participation-mode.js';
import { assertParticipantMeetsWomenOnlyRequirement } from '../domain/activity-audience-requirements.js';

const ACTIVE_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'WAITLISTED'];

export const isActivityFull = (capacity: number, participantCount: number): boolean =>
  participantCount >= capacity;

type MongoActivityRequest = {
  _id: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  note: string | null;
  organizerNote: string | null;
  cancelReason: string | null;
  cancelMessage: string | null;
  cancelledAt: Date | null;
  selectedPackageIndex: number | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MongoActivityParticipant = {
  _id: string;
  activityId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  createdAt: Date;
};

const activityRequestsCollection = (): Collection<MongoActivityRequest> =>
  getMongoClient()!.db().collection<MongoActivityRequest>('activity_requests');

const activityParticipantsCollection = (): Collection<MongoActivityParticipant> =>
  getMongoClient()!.db().collection<MongoActivityParticipant>('activity_participants');

type TenantActivitySummary = {
  _id: string;
  tenantId: string;
  title: string;
  startAt: Date;
  locationId: string;
};

const activitiesCollection = (): Collection<TenantActivitySummary> =>
  getMongoClient()!.db().collection<TenantActivitySummary>('activities');

const toActivityRequestRecord = (doc: MongoActivityRequest): ActivityRequest => ({
  id: doc._id,
  activityId: doc.activityId,
  userId: doc.userId,
  status: doc.status,
  note: doc.note,
  organizerNote: doc.organizerNote,
  cancelReason: doc.cancelReason,
  cancelMessage: doc.cancelMessage,
  cancelledAt: doc.cancelledAt,
  selectedPackageIndex: doc.selectedPackageIndex,
  reviewedAt: doc.reviewedAt,
  reviewedById: doc.reviewedById,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const toActivityParticipantRecord = (doc: MongoActivityParticipant): ActivityParticipant => ({
  id: doc._id,
  activityId: doc.activityId,
  requestId: doc.requestId,
  userId: doc.userId,
  approvedById: doc.approvedById,
  checkedInAt: doc.checkedInAt,
  createdAt: doc.createdAt
});

const patchActivityRequestInMongo = async (
  id: string,
  patch: Partial<Omit<MongoActivityRequest, '_id'>>
): Promise<void> => {
  await activityRequestsCollection().updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

const patchActivityParticipantInMongo = async (
  id: string,
  patch: Partial<Omit<MongoActivityParticipant, '_id'>>
): Promise<void> => {
  await activityParticipantsCollection().updateOne({ _id: id }, { $set: patch });
};

const loadPublishedEventForJoin = async (activityId: string) => {
  const doc = await findActivityDocInMongo(activityId);
  if (!doc || doc.status !== ActivityStatus.PUBLISHED) return null;

  const participantCount = await activityParticipantsCollection().countDocuments({ activityId });
  return {
    id: doc._id,
    capacity: doc.capacity,
    pricePackages: doc.pricePackages,
    participationMode: resolveParticipationMode(doc.participationMode, doc.requirements),
    requirements: doc.requirements ?? [],
    hostId: doc.hostId,
    createdById: doc.createdById,
    participants: Array.from({ length: participantCount }, (_, index) => ({ id: String(index) }))
  };
};

const isEventHost = async (
  event: { hostId?: string | null; createdById?: string; tenantId?: string },
  hostUserId: string,
  organizerRoles: MembershipRole[]
): Promise<boolean> => {
  if (event.hostId === hostUserId || event.createdById === hostUserId) {
    return true;
  }
  if (!event.tenantId) return false;
  const membership = await getMongoClient()!
    .db()
    .collection('tenant_memberships')
    .findOne({ tenantId: event.tenantId, userId: hostUserId, role: { $in: organizerRoles } });
  return Boolean(membership);
};

export async function createJoinOrWaitlistRequest(opts: {
  activityId: string;
  userId: string;
  note?: string;
  selectedPackageIndex?: number;
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

  const packages = parseStoredPricePackages(event.pricePackages);
  if (packages.length > 1) {
    if (opts.selectedPackageIndex === undefined) {
      throw new ApiError(400, 'package_required', 'Select a package option to join this activity.');
    }
    if (opts.selectedPackageIndex < 0 || opts.selectedPackageIndex >= packages.length) {
      throw new ApiError(400, 'invalid_package', 'Selected package is not valid for this activity.');
    }
  }

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);

  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
  }

  const waitlisted = isActivityFull(event.capacity, event.participants.length);
  const status = waitlisted ? RequestStatus.WAITLISTED : RequestStatus.PENDING;
  const requestId = existing?.id ?? newEntityId();
  const now = new Date();

  await activityRequestsCollection().updateOne(
    { _id: requestId },
    {
      $set: {
        activityId: opts.activityId,
        userId: opts.userId,
        status,
        note: opts.note ?? existing?.note ?? null,
        organizerNote: null,
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex:
          opts.selectedPackageIndex !== undefined
            ? opts.selectedPackageIndex
            : existing?.selectedPackageIndex ?? null,
        reviewedAt: null,
        reviewedById: null,
        updatedAt: now,
        createdAt: existing?.createdAt ?? now
      }
    },
    { upsert: true }
  );

  const mongoRow = await activityRequestsCollection().findOne({ _id: requestId });
  if (!mongoRow) {
    throw new ApiError(500, 'request_persist_failed', 'Failed to persist join request.');
  }

  return { request: toActivityRequestRecord(mongoRow), waitlisted };
}

export async function createRsvpParticipation(opts: {
  activityId: string;
  userId: string;
  selectedPackageIndex?: number;
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

  const existingParticipant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (existingParticipant) {
    throw new ApiError(409, 'already_joined', 'You are already going to this activity.');
  }

  const packages = parseStoredPricePackages(event.pricePackages);
  if (packages.length > 1) {
    if (opts.selectedPackageIndex === undefined) {
      throw new ApiError(400, 'package_required', 'Select a package option to join this activity.');
    }
    if (opts.selectedPackageIndex < 0 || opts.selectedPackageIndex >= packages.length) {
      throw new ApiError(400, 'invalid_package', 'Selected package is not valid for this activity.');
    }
  }

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);
  if (existing && existing.status === RequestStatus.APPROVED) {
    throw new ApiError(409, 'already_joined', 'You are already going to this activity.');
  }

  if (isActivityFull(event.capacity, event.participants.length)) {
    throw new ApiError(400, 'activity_full', 'This activity is full.');
  }

  const reserved = await tryReserveActivityParticipantSlot(opts.activityId, ActivityStatus.PUBLISHED);
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
          note: existing?.note ?? null,
          organizerNote: null,
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex:
            opts.selectedPackageIndex !== undefined
              ? opts.selectedPackageIndex
              : existing?.selectedPackageIndex ?? null,
          reviewedAt: now,
          reviewedById: reviewerId,
          updatedAt: now,
          createdAt: existing?.createdAt ?? now
        }
      },
      { upsert: true }
    );

    await activityParticipantsCollection().updateOne(
      { _id: participantId },
      {
        $set: {
          activityId: opts.activityId,
          requestId,
          userId: opts.userId,
          approvedById: reviewerId,
          checkedInAt: null,
          createdAt: now
        }
      },
      { upsert: true }
    );
  } catch (error) {
    await releaseActivityParticipantSlot(opts.activityId);
    throw error;
  }

  await addParticipantToActivityGroupChat({
    activityId: opts.activityId,
    userId: opts.userId,
  }).catch(() => undefined);

  const mongoRow = await activityRequestsCollection().findOne({ _id: requestId });
  if (!mongoRow) {
    throw new ApiError(500, 'request_persist_failed', 'Failed to persist RSVP.');
  }

  const participant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (!participant) {
    throw new ApiError(500, 'participation_persist_failed', 'Failed to persist RSVP participation.');
  }

  return {
    request: toActivityRequestRecord(mongoRow),
    participation: participant
  };
}

/** Promote oldest waitlisted request to pending when a slot opens. */
async function promoteNextWaitlisted(activityId: string): Promise<boolean> {
  const eventDoc = await findActivityDocInMongo(activityId);
  if (!eventDoc) return false;

  const participantCount = await activityParticipantsCollection().countDocuments({ activityId });
  if (isActivityFull(eventDoc.capacity, participantCount)) {
    return false;
  }

  const next = await activityRequestsCollection().findOne(
    { activityId, status: RequestStatus.WAITLISTED },
    { sort: { createdAt: 1 } }
  );
  if (!next) return false;

  await patchActivityRequestInMongo(next._id, { status: RequestStatus.PENDING });

  await dispatchNotification({
    userId: next.userId,
    title: 'A spot opened up!',
    body: 'Your waitlisted activity now has availability. Your request is pending organizer approval.',
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

export const findActivityRequestByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<ActivityRequest | null> => {
  const row = await activityRequestsCollection().findOne({ activityId, userId });
  return row ? toActivityRequestRecord(row) : null;
};

export const findActivityRequestByIdForUser = async (
  id: string,
  userId: string
): Promise<ActivityRequest | null> => {
  const row = await activityRequestsCollection().findOne({ _id: id, userId });
  return row ? toActivityRequestRecord(row) : null;
};

export const updateActivityRequestNote = async (id: string, note: string): Promise<ActivityRequest> => {
  await patchActivityRequestInMongo(id, { note });
  const mongoRow = await activityRequestsCollection().findOne({ _id: id });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toActivityRequestRecord({ ...mongoRow, note });
};

export const listUserActivityRequestsBasic = async (userId: string, take = 200): Promise<ActivityRequest[]> => {
  const rows = await activityRequestsCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();
  return rows.map(toActivityRequestRecord);
};

export const listUserActivityRequestsPaginated = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<ActivityRequest[]> => {
  const rows = await activityRequestsCollection()
    .find({ userId: input.userId })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();
  return rows.map(toActivityRequestRecord);
};

export const countUserActivityRequests = async (userId: string): Promise<number> =>
  activityRequestsCollection().countDocuments({ userId });

export const findActivityParticipantByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<ActivityParticipant | null> => {
  const row = await activityParticipantsCollection().findOne({ activityId, userId });
  return row ? toActivityParticipantRecord(row) : null;
};

export const findActivityParticipantByIdAndActivity = async (
  id: string,
  activityId: string
): Promise<ActivityParticipant | null> => {
  const row = await activityParticipantsCollection().findOne({ _id: id, activityId });
  return row ? toActivityParticipantRecord(row) : null;
};

export const clearActivityParticipantCheckIn = async (id: string): Promise<void> => {
  await patchActivityParticipantInMongo(id, { checkedInAt: null });
};

export const listUserActivityParticipantsBasic = async (
  userId: string,
  take = 200
): Promise<ActivityParticipant[]> => {
  const rows = await activityParticipantsCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();
  return rows.map(toActivityParticipantRecord);
};

export const listUserActivityParticipantsPaginated = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<ActivityParticipant[]> => {
  const rows = await activityParticipantsCollection()
    .find({ userId: input.userId })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();
  return rows.map(toActivityParticipantRecord);
};

export const countUserActivityParticipants = async (userId: string): Promise<number> =>
  activityParticipantsCollection().countDocuments({ userId });

export const countUserCheckedInParticipations = async (userId: string): Promise<number> =>
  activityParticipantsCollection().countDocuments({ userId, checkedInAt: { $ne: null } });

export const countPublishedActivitiesHostedByUser = async (userId: string): Promise<number> =>
  activitiesCollection().countDocuments({
    status: ActivityStatus.PUBLISHED,
    $or: [{ hostId: userId }, { createdById: userId }],
  });

export const hasSharedActivityParticipation = async (firstUserId: string, secondUserId: string): Promise<boolean> => {
  const firstUserEvents = await activityParticipantsCollection()
    .aggregate<{ _id: string }>([
      { $match: { userId: firstUserId } },
      { $group: { _id: '$activityId' } }
    ])
    .toArray();

  if (firstUserEvents.length === 0) return false;

  const shared = await activityParticipantsCollection().findOne({
    userId: secondUserId,
    activityId: { $in: firstUserEvents.map((row) => row._id) }
  });
  return Boolean(shared);
};

export const hasActiveJoinRequestLink = async (input: {
  senderId: string;
  receiverId: string;
  organizerRoles: MembershipRole[];
  activeStatuses: RequestStatus[];
}): Promise<boolean> => {
  const requests = await activityRequestsCollection()
    .find({
      status: { $in: input.activeStatuses },
      userId: { $in: [input.senderId, input.receiverId] }
    })
    .toArray();

  for (const request of requests) {
    const event = await findActivityDocInMongo(request.activityId);
    if (!event) continue;

    const requestUserId = request.userId;
    const otherUserId = requestUserId === input.senderId ? input.receiverId : input.senderId;
    if (requestUserId !== input.senderId && requestUserId !== input.receiverId) continue;

    if (await isEventHost(event, otherUserId, input.organizerRoles)) {
      return true;
    }
  }

  return false;
};

/** True when requester has an active join request on an activity hosted by hostUserId. */
export const hostHasActiveJoinRequestFromUser = async (
  hostUserId: string,
  requesterUserId: string,
  input: {
    organizerRoles: MembershipRole[];
    activeStatuses: RequestStatus[];
  }
): Promise<boolean> => {
  const requests = await activityRequestsCollection()
    .find({
      userId: requesterUserId,
      status: { $in: input.activeStatuses },
    })
    .toArray();

  for (const request of requests) {
    const event = await findActivityDocInMongo(request.activityId);
    if (!event) continue;
    if (await isEventHost(event, hostUserId, input.organizerRoles)) {
      return true;
    }
  }

  return false;
};

export const hasParticipantToHostLink = async (input: {
  participantUserId: string;
  hostUserId: string;
  organizerRoles: MembershipRole[];
}): Promise<boolean> => {
  const participants = await activityParticipantsCollection().find({ userId: input.participantUserId }).toArray();
  for (const participant of participants) {
    const event = await findActivityDocInMongo(participant.activityId);
    if (!event) continue;
    if (await isEventHost(event, input.hostUserId, input.organizerRoles)) {
      return true;
    }
  }
  return false;
};

export const hasHostToParticipantLink = async (hostUserId: string, participantUserId: string): Promise<boolean> => {
  const participants = await activityParticipantsCollection().find({ userId: participantUserId }).toArray();
  for (const participant of participants) {
    const event = await findActivityDocInMongo(participant.activityId);
    if (!event) continue;
    if (event.hostId === hostUserId || event.createdById === hostUserId) {
      return true;
    }
  }
  return false;
};

/** True when both users are co-participants or one hosts an event the other joined. */
export const usersShareActivity = async (userA: string, userB: string): Promise<boolean> => {
  if (!userA || !userB) return false;
  if (userA === userB) return true;

  const participantRows = await activityParticipantsCollection()
    .find({ userId: userA }, { projection: { activityId: 1 } })
    .toArray();
  const eventIds = [...new Set(participantRows.map((row) => row.activityId).filter(Boolean))];
  if (eventIds.length > 0) {
    const shared = await activityParticipantsCollection().findOne({
      userId: userB,
      activityId: { $in: eventIds }
    });
    if (shared) return true;
  }

  return (await hasHostToParticipantLink(userA, userB)) || (await hasHostToParticipantLink(userB, userA));
};

export const hasActivityInquiryAccess = async (input: {
  activityId: string;
  receiverId: string;
  organizerRoles: MembershipRole[];
}): Promise<boolean> => {
  const event = await findActivityDocInMongo(input.activityId);
  if (!event || event.status !== ActivityStatus.PUBLISHED) return false;
  return isEventHost(event, input.receiverId, input.organizerRoles);
};

export const countPendingActivityRequests = async (): Promise<number> =>
  activityRequestsCollection().countDocuments({ status: RequestStatus.PENDING });

export const countActivityParticipants = async (): Promise<number> =>
  activityParticipantsCollection().countDocuments({});

export const listTenantActivityRequestsDetailed = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  activityId?: string;
}) => {
  const eventFilter: { tenantId: string; _id?: string } = { tenantId: input.tenantId };
  if (input.activityId) {
    eventFilter._id = input.activityId;
  }

  const tenantEvents = await activitiesCollection()
    .find(eventFilter, { projection: { _id: 1, title: 1, startAt: 1, locationId: 1 } })
    .toArray();
  const eventIds = tenantEvents.map((event) => event._id);
  if (eventIds.length === 0) return [];

  const eventMap = new Map(
    tenantEvents.map((event) => [
      event._id,
      {
        id: event._id,
        title: event.title,
        startAt: event.startAt,
        locationId: event.locationId
      }
    ])
  );

  const locationIds = [...new Set(tenantEvents.map((event) => event.locationId))];
  const locationEntries = await Promise.all(
    locationIds.map(async (locationId) => [locationId, await findLocationInMongo(locationId)] as const)
  );
  const locationMap = new Map(
    locationEntries.filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1]))
  );

  const requests = await activityRequestsCollection()
    .find({ activityId: { $in: eventIds } })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();

  const users = await findAuthUsersByIds(requests.map((request) => request.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return requests.map((request) => {
    const event = eventMap.get(request.activityId)!;
    const location = locationMap.get(event.locationId);
    const user = userMap.get(request.userId);
    return {
      ...toActivityRequestRecord(request),
      user: {
        id: request.userId,
        email: user?.email ?? '',
        profile: user
          ? {
              displayName: user.profile.displayName
            }
          : null
      },
      activity: {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        location: location ?? { id: event.locationId, name: '' }
      }
    };
  });
};

export const countTenantActivityRequests = async (
  tenantId: string,
  activityId?: string
): Promise<number> => {
  const eventFilter: { tenantId: string; _id?: string } = { tenantId };
  if (activityId) {
    eventFilter._id = activityId;
  }
  const tenantEvents = await activitiesCollection().find(eventFilter, { projection: { _id: 1 } }).toArray();
  const eventIds = tenantEvents.map((event) => event._id);
  if (eventIds.length === 0) return 0;
  return activityRequestsCollection().countDocuments({ activityId: { $in: eventIds } });
};

export const findTenantActivityRequestForDecision = async (id: string, tenantId: string) => {
  const request = await activityRequestsCollection().findOne({ _id: id });
  if (!request) return null;

  const eventDoc = await findActivityDocInMongo(request.activityId);
  if (!eventDoc || eventDoc.tenantId !== tenantId) return null;

  const [user] = await findAuthUsersByIds([request.userId]);
  const participants = await activityParticipantsCollection().find({ activityId: request.activityId }).toArray();
  const location = await findLocationInMongo(eventDoc.locationId);

  return {
    ...toActivityRequestRecord(request),
    user: {
      id: request.userId,
      email: user?.email ?? '',
      profile: user ? { displayName: user.profile.displayName } : null
    },
    activity: {
      id: eventDoc._id,
      title: eventDoc.title,
      startAt: eventDoc.startAt,
      capacity: eventDoc.capacity,
      status: eventDoc.status,
      location: location ?? { id: eventDoc.locationId, name: '' },
      participants: participants.map(toActivityParticipantRecord)
    }
  };
};

export type EnrollHostApprovedActivityParticipantResult = 'enrolled' | 'skipped';

/**
 * Host-approved crew row (approval path) — used for tenant request approval and demand carry-over.
 * Does not use RSVP instant-join even when the activity is in rsvp mode.
 */
export const enrollHostApprovedActivityParticipant = async (opts: {
  activityId: string;
  userId: string;
  reviewerId: string;
  organizerNote?: string | null;
  /** When true, skip users who fail audience rules or capacity instead of throwing. */
  lenient?: boolean;
}): Promise<EnrollHostApprovedActivityParticipantResult> => {
  const existingParticipant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (existingParticipant) return 'skipped';

  const eventDoc = await findActivityDocInMongo(opts.activityId);
  if (!eventDoc || eventDoc.status !== ActivityStatus.PUBLISHED) {
    if (opts.lenient) return 'skipped';
    throw new ApiError(400, 'event_not_publishable', 'Event must be published before approval.');
  }

  if (eventDoc.hostId === opts.userId || eventDoc.createdById === opts.userId) return 'skipped';

  try {
    await assertParticipantMeetsWomenOnlyRequirement(opts.userId, eventDoc.requirements ?? []);
  } catch (error) {
    if (opts.lenient) return 'skipped';
    throw error;
  }

  if (eventDoc.participantSlotsUsed === undefined) {
    const participantCount = await activityParticipantsCollection().countDocuments({
      activityId: opts.activityId,
    });
    await patchActivityInMongo(opts.activityId, { participantSlotsUsed: participantCount });
  }

  const reserved = await tryReserveActivityParticipantSlot(opts.activityId, ActivityStatus.PUBLISHED);
  if (!reserved) {
    if (opts.lenient) return 'skipped';
    throw new ApiError(400, 'activity_full', 'Activity capacity has already been reached.');
  }

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);
  const requestId = existing?.id ?? newEntityId();
  const participantId = newEntityId();
  const reviewedAt = new Date();

  try {
    await activityRequestsCollection().updateOne(
      { _id: requestId },
      {
        $set: {
          activityId: opts.activityId,
          userId: opts.userId,
          status: RequestStatus.APPROVED,
          note: existing?.note ?? null,
          organizerNote: opts.organizerNote ?? null,
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex: existing?.selectedPackageIndex ?? null,
          reviewedAt,
          reviewedById: opts.reviewerId,
          updatedAt: reviewedAt,
          createdAt: existing?.createdAt ?? reviewedAt,
        },
      },
      { upsert: true }
    );

    await activityParticipantsCollection().updateOne(
      { _id: participantId },
      {
        $set: {
          activityId: opts.activityId,
          requestId,
          userId: opts.userId,
          approvedById: opts.reviewerId,
          checkedInAt: null,
          createdAt: reviewedAt,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    await releaseActivityParticipantSlot(opts.activityId);
    throw error;
  }

  await addParticipantToActivityGroupChat({
    activityId: opts.activityId,
    userId: opts.userId,
  }).catch(() => undefined);

  return 'enrolled';
};

export const applyTenantActivityRequestDecision = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  reviewerId: string;
  decision: 'approved' | 'rejected';
  organizerNote?: string;
}) => {
  const reviewedAt = new Date();

  if (input.decision === 'approved') {
    const enrolled = await enrollHostApprovedActivityParticipant({
      activityId: input.activityId,
      userId: input.userId,
      reviewerId: input.reviewerId,
      organizerNote: input.organizerNote ?? null,
    });

    if (enrolled === 'skipped') {
      const existingParticipant = await findActivityParticipantByEventAndUser(
        input.activityId,
        input.userId
      );
      if (existingParticipant) return;
      throw new ApiError(400, 'approval_failed', 'Could not approve this join request.');
    }
    return;
  }

  await patchActivityRequestInMongo(input.requestId, {
    status: RequestStatus.REJECTED,
    organizerNote: input.organizerNote ?? null,
    reviewedById: input.reviewerId,
    reviewedAt
  });

  const mongoRow = await activityRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
};

export const cancelUserActivityRequestAndPromoteWaitlist = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  cancelReason: string;
  cancelMessage: string | null;
}) => {
  const cancelledAt = new Date();

  await patchActivityRequestInMongo(input.requestId, {
    status: RequestStatus.CANCELLED,
    cancelReason: input.cancelReason,
    cancelMessage: input.cancelMessage,
    cancelledAt
  });
  const deleted = await activityParticipantsCollection().deleteMany({ requestId: input.requestId });
  if (deleted.deletedCount > 0) {
    await releaseActivityParticipantSlot(input.activityId);
    void removeParticipantFromActivityGroupChat({
      activityId: input.activityId,
      userId: input.userId
    }).catch(() => undefined);
  }
  await promoteNextWaitlisted(input.activityId);
};

export const listActivityRequestsForActivity = async (activityId: string): Promise<ActivityRequest[]> => {
  const rows = await activityRequestsCollection()
    .find({ activityId })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map(toActivityRequestRecord);
};

export const listActivityParticipantsWithUsers = async (activityId: string) => {
  const participants = await activityParticipantsCollection()
    .find({ activityId })
    .sort({ createdAt: 1 })
    .toArray();

  const users = await findAuthUsersByIds(participants.map((participant) => participant.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return participants.map((participant) => {
    const user = userMap.get(participant.userId);
    return {
      ...toActivityParticipantRecord(participant),
      user: {
        id: participant.userId,
        email: user?.email ?? '',
        profile: user
          ? {
              displayName: user.profile.displayName,
              phone: user.profile.phone,
              avatarUrl: user.profile.avatarUrl
            }
          : null
      }
    };
  });
};

export const purgeUserActivityEngagement = async (userId: string): Promise<void> => {
  const participants = await activityParticipantsCollection().find({ userId }).toArray();
  for (const participant of participants) {
    await releaseActivityParticipantSlot(participant.activityId);
  }
  await activityParticipantsCollection().deleteMany({ userId });
  await activityRequestsCollection().deleteMany({ userId });
};
