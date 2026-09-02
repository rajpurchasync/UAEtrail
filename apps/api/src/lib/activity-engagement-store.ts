import type { Collection } from 'mongodb';
import {
  ActivityStatus,
  NotificationType,
  RequestStatus,
  type MembershipRole
} from '../domain/enums.js';
import type { EventParticipant, EventRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { assertCapacityAvailable } from '../domain/capacity.js';
import { findAuthUsersByIds } from './auth-users.js';
import { newEntityId } from './entity-builders.js';
import {
  findEventDocInMongo,
  findLocationInMongo,
  patchEventInMongo,
  releaseEventParticipantSlot,
  tryReserveEventParticipantSlot
} from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { parseStoredPricePackages } from './trip-pricing.js';
import { dispatchNotificationDefault } from '../services/notifications.js';

const ACTIVE_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'WAITLISTED'];

export const isEventFull = (capacity: number, participantCount: number): boolean =>
  participantCount >= capacity;

export function assertCanApproveRequest(capacity: number, participantCount: number): void {
  assertCapacityAvailable(capacity, participantCount);
}

type MongoEventRequest = {
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

type MongoEventParticipant = {
  _id: string;
  activityId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  createdAt: Date;
};

const eventRequestsCollection = (): Collection<MongoEventRequest> =>
  getMongoClient()!.db().collection<MongoEventRequest>('activity_requests');

const eventParticipantsCollection = (): Collection<MongoEventParticipant> =>
  getMongoClient()!.db().collection<MongoEventParticipant>('activity_participants');

type TenantEventSummary = {
  _id: string;
  tenantId: string;
  title: string;
  startAt: Date;
  locationId: string;
};

const eventsCollection = (): Collection<TenantEventSummary> =>
  getMongoClient()!.db().collection<TenantEventSummary>('activities');

const toEventRequestRecord = (doc: MongoEventRequest): EventRequest => ({
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

const toEventParticipantRecord = (doc: MongoEventParticipant): EventParticipant => ({
  id: doc._id,
  activityId: doc.activityId,
  requestId: doc.requestId,
  userId: doc.userId,
  approvedById: doc.approvedById,
  checkedInAt: doc.checkedInAt,
  createdAt: doc.createdAt
});

const patchEventRequestInMongo = async (
  id: string,
  patch: Partial<Omit<MongoEventRequest, '_id'>>
): Promise<void> => {
  await eventRequestsCollection().updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

const patchEventParticipantInMongo = async (
  id: string,
  patch: Partial<Omit<MongoEventParticipant, '_id'>>
): Promise<void> => {
  await eventParticipantsCollection().updateOne({ _id: id }, { $set: patch });
};

const loadPublishedEventForJoin = async (activityId: string) => {
  const doc = await findEventDocInMongo(activityId);
  if (!doc || doc.status !== ActivityStatus.PUBLISHED) return null;

  const participantCount = await eventParticipantsCollection().countDocuments({ activityId });
  return {
    id: doc._id,
    capacity: doc.capacity,
    pricePackages: doc.pricePackages,
    participants: Array.from({ length: participantCount }, (_, index) => ({ id: String(index) }))
  };
};

const isEventHost = async (
  event: { guideId?: string | null; createdById?: string; tenantId?: string },
  hostUserId: string,
  organizerRoles: MembershipRole[]
): Promise<boolean> => {
  if (event.guideId === hostUserId || event.createdById === hostUserId) {
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
    throw new ApiError(404, 'event_not_found', 'Event not found.');
  }

  const packages = parseStoredPricePackages(event.pricePackages);
  if (packages.length > 1) {
    if (opts.selectedPackageIndex === undefined) {
      throw new ApiError(400, 'package_required', 'Select a package option to join this trip.');
    }
    if (opts.selectedPackageIndex < 0 || opts.selectedPackageIndex >= packages.length) {
      throw new ApiError(400, 'invalid_package', 'Selected package is not valid for this trip.');
    }
  }

  const existing = await findEventRequestByEventAndUser(opts.activityId, opts.userId);

  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
  }

  const waitlisted = isEventFull(event.capacity, event.participants.length);
  const status = waitlisted ? RequestStatus.WAITLISTED : RequestStatus.PENDING;
  const requestId = existing?.id ?? newEntityId();
  const now = new Date();

  await eventRequestsCollection().updateOne(
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

  const mongoRow = await eventRequestsCollection().findOne({ _id: requestId });
  if (!mongoRow) {
    throw new ApiError(500, 'request_persist_failed', 'Failed to persist join request.');
  }

  return { request: toEventRequestRecord(mongoRow), waitlisted };
}

export async function createJoinOrWaitlistRequestDefault(opts: {
  activityId: string;
  userId: string;
  note?: string;
  selectedPackageIndex?: number;
}) {
  return createJoinOrWaitlistRequest(opts);
}

/** Promote oldest waitlisted request to pending when a slot opens. */
export async function promoteNextWaitlisted(activityId: string): Promise<boolean> {
  const eventDoc = await findEventDocInMongo(activityId);
  if (!eventDoc) return false;

  const participantCount = await eventParticipantsCollection().countDocuments({ activityId });
  if (isEventFull(eventDoc.capacity, participantCount)) {
    return false;
  }

  const next = await eventRequestsCollection().findOne(
    { activityId, status: RequestStatus.WAITLISTED },
    { sort: { createdAt: 1 } }
  );
  if (!next) return false;

  await patchEventRequestInMongo(next._id, { status: RequestStatus.PENDING });

  await dispatchNotificationDefault({
    userId: next.userId,
    title: 'A spot opened up!',
    body: 'Your waitlisted trip now has availability. Your request is pending organizer approval.',
    type: NotificationType.REQUEST_UPDATE,
    meta: { activityId, requestId: next._id, fromWaitlist: true }
  });

  return true;
}

export const findEventRequestByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<EventRequest | null> => {
  const row = await eventRequestsCollection().findOne({ activityId, userId });
  return row ? toEventRequestRecord(row) : null;
};

export const findEventRequestByIdForUser = async (
  id: string,
  userId: string
): Promise<EventRequest | null> => {
  const row = await eventRequestsCollection().findOne({ _id: id, userId });
  return row ? toEventRequestRecord(row) : null;
};

export const updateEventRequestNote = async (id: string, note: string): Promise<EventRequest> => {
  await patchEventRequestInMongo(id, { note });
  const mongoRow = await eventRequestsCollection().findOne({ _id: id });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
  return toEventRequestRecord({ ...mongoRow, note });
};

export const listUserEventRequestsBasic = async (userId: string, take = 200): Promise<EventRequest[]> => {
  const rows = await eventRequestsCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();
  return rows.map(toEventRequestRecord);
};

export const listUserEventRequestsPaginated = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<EventRequest[]> => {
  const rows = await eventRequestsCollection()
    .find({ userId: input.userId })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();
  return rows.map(toEventRequestRecord);
};

export const countUserEventRequests = async (userId: string): Promise<number> =>
  eventRequestsCollection().countDocuments({ userId });

export const findEventParticipantByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<EventParticipant | null> => {
  const row = await eventParticipantsCollection().findOne({ activityId, userId });
  return row ? toEventParticipantRecord(row) : null;
};

export const findEventParticipantByIdAndEvent = async (
  id: string,
  activityId: string
): Promise<EventParticipant | null> => {
  const row = await eventParticipantsCollection().findOne({ _id: id, activityId });
  return row ? toEventParticipantRecord(row) : null;
};

export const clearEventParticipantCheckIn = async (id: string): Promise<void> => {
  await patchEventParticipantInMongo(id, { checkedInAt: null });
};

export const listUserEventParticipantsBasic = async (
  userId: string,
  take = 200
): Promise<EventParticipant[]> => {
  const rows = await eventParticipantsCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();
  return rows.map(toEventParticipantRecord);
};

export const listUserEventParticipantsPaginated = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<EventParticipant[]> => {
  const rows = await eventParticipantsCollection()
    .find({ userId: input.userId })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();
  return rows.map(toEventParticipantRecord);
};

export const countUserEventParticipants = async (userId: string): Promise<number> =>
  eventParticipantsCollection().countDocuments({ userId });

export const hasSharedEventParticipation = async (firstUserId: string, secondUserId: string): Promise<boolean> => {
  const firstUserEvents = await eventParticipantsCollection()
    .aggregate<{ _id: string }>([
      { $match: { userId: firstUserId } },
      { $group: { _id: '$activityId' } }
    ])
    .toArray();

  if (firstUserEvents.length === 0) return false;

  const shared = await eventParticipantsCollection().findOne({
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
  const requests = await eventRequestsCollection()
    .find({
      status: { $in: input.activeStatuses },
      userId: { $in: [input.senderId, input.receiverId] }
    })
    .toArray();

  for (const request of requests) {
    const event = await findEventDocInMongo(request.activityId);
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

export const hasParticipantToHostLink = async (input: {
  participantUserId: string;
  hostUserId: string;
  organizerRoles: MembershipRole[];
}): Promise<boolean> => {
  const participants = await eventParticipantsCollection().find({ userId: input.participantUserId }).toArray();
  for (const participant of participants) {
    const event = await findEventDocInMongo(participant.activityId);
    if (!event) continue;
    if (await isEventHost(event, input.hostUserId, input.organizerRoles)) {
      return true;
    }
  }
  return false;
};

export const hasHostToParticipantLink = async (hostUserId: string, participantUserId: string): Promise<boolean> => {
  const participants = await eventParticipantsCollection().find({ userId: participantUserId }).toArray();
  for (const participant of participants) {
    const event = await findEventDocInMongo(participant.activityId);
    if (!event) continue;
    if (event.guideId === hostUserId || event.createdById === hostUserId) {
      return true;
    }
  }
  return false;
};

/** True when both users are co-participants or one hosts an event the other joined. */
export const usersShareActivity = async (userA: string, userB: string): Promise<boolean> => {
  if (!userA || !userB) return false;
  if (userA === userB) return true;

  const eventIds = await eventParticipantsCollection().distinct('activityId', { userId: userA });
  if (eventIds.length > 0) {
    const shared = await eventParticipantsCollection().findOne({
      userId: userB,
      activityId: { $in: eventIds }
    });
    if (shared) return true;
  }

  return (await hasHostToParticipantLink(userA, userB)) || (await hasHostToParticipantLink(userB, userA));
};

export const hasTripInquiryAccess = async (input: {
  activityId: string;
  receiverId: string;
  organizerRoles: MembershipRole[];
}): Promise<boolean> => {
  const event = await findEventDocInMongo(input.activityId);
  if (!event || event.status !== ActivityStatus.PUBLISHED) return false;
  return isEventHost(event, input.receiverId, input.organizerRoles);
};

export const countPendingEventRequests = async (): Promise<number> =>
  eventRequestsCollection().countDocuments({ status: RequestStatus.PENDING });

export const countEventParticipants = async (): Promise<number> =>
  eventParticipantsCollection().countDocuments({});

export const listTenantEventRequestsDetailed = async (input: {
  tenantId: string;
  skip: number;
  take: number;
}) => {
  const tenantEvents = await eventsCollection()
    .find({ tenantId: input.tenantId }, { projection: { _id: 1, title: 1, startAt: 1, locationId: 1 } })
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

  const requests = await eventRequestsCollection()
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
      ...toEventRequestRecord(request),
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

export const countTenantEventRequests = async (tenantId: string): Promise<number> => {
  const tenantEvents = await eventsCollection().find({ tenantId }, { projection: { _id: 1 } }).toArray();
  const eventIds = tenantEvents.map((event) => event._id);
  if (eventIds.length === 0) return 0;
  return eventRequestsCollection().countDocuments({ activityId: { $in: eventIds } });
};

export const findTenantEventRequestForDecision = async (id: string, tenantId: string) => {
  const request = await eventRequestsCollection().findOne({ _id: id });
  if (!request) return null;

  const eventDoc = await findEventDocInMongo(request.activityId);
  if (!eventDoc || eventDoc.tenantId !== tenantId) return null;

  const [user] = await findAuthUsersByIds([request.userId]);
  const participants = await eventParticipantsCollection().find({ activityId: request.activityId }).toArray();
  const location = await findLocationInMongo(eventDoc.locationId);

  return {
    ...toEventRequestRecord(request),
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
      participants: participants.map(toEventParticipantRecord)
    }
  };
};

export const applyTenantEventRequestDecision = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  reviewerId: string;
  decision: 'approved' | 'rejected';
  organizerNote?: string;
}) => {
  const reviewedAt = new Date();

  if (input.decision === 'approved') {
    const eventDoc = await findEventDocInMongo(input.activityId);
    if (!eventDoc || eventDoc.status !== ActivityStatus.PUBLISHED) {
      throw new ApiError(400, 'event_not_publishable', 'Event must be published before approval.');
    }

    if (eventDoc.participantSlotsUsed === undefined) {
      const participantCount = await eventParticipantsCollection().countDocuments({ activityId: input.activityId });
      await patchEventInMongo(input.activityId, { participantSlotsUsed: participantCount });
    }

    const reserved = await tryReserveEventParticipantSlot(input.activityId, ActivityStatus.PUBLISHED);
    if (!reserved) {
      throw new ApiError(400, 'event_full', 'Event capacity has already been reached.');
    }

    const participantId = newEntityId();
    try {
      await patchEventRequestInMongo(input.requestId, {
        status: RequestStatus.APPROVED,
        organizerNote: input.organizerNote ?? null,
        reviewedById: input.reviewerId,
        reviewedAt
      });
      await eventParticipantsCollection().updateOne(
        { _id: participantId },
        {
          $set: {
            activityId: input.activityId,
            requestId: input.requestId,
            userId: input.userId,
            approvedById: input.reviewerId,
            checkedInAt: null,
            createdAt: reviewedAt
          }
        },
        { upsert: true }
      );
    } catch (error) {
      await releaseEventParticipantSlot(input.activityId);
      throw error;
    }
    return;
  }

  await patchEventRequestInMongo(input.requestId, {
    status: RequestStatus.REJECTED,
    organizerNote: input.organizerNote ?? null,
    reviewedById: input.reviewerId,
    reviewedAt
  });

  const mongoRow = await eventRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
};

export const cancelUserEventRequestAndPromoteWaitlist = async (input: {
  requestId: string;
  activityId: string;
  cancelReason: string;
  cancelMessage: string | null;
}) => {
  const cancelledAt = new Date();

  await patchEventRequestInMongo(input.requestId, {
    status: RequestStatus.CANCELLED,
    cancelReason: input.cancelReason,
    cancelMessage: input.cancelMessage,
    cancelledAt
  });
  const deleted = await eventParticipantsCollection().deleteMany({ requestId: input.requestId });
  if (deleted.deletedCount > 0) {
    await releaseEventParticipantSlot(input.activityId);
  }
  await promoteNextWaitlisted(input.activityId);
};

export const listEventParticipantsWithUsers = async (activityId: string) => {
  const participants = await eventParticipantsCollection()
    .find({ activityId })
    .sort({ createdAt: 1 })
    .toArray();

  const users = await findAuthUsersByIds(participants.map((participant) => participant.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));

  return participants.map((participant) => {
    const user = userMap.get(participant.userId);
    return {
      ...toEventParticipantRecord(participant),
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
  const participants = await eventParticipantsCollection().find({ userId }).toArray();
  for (const participant of participants) {
    await releaseEventParticipantSlot(participant.activityId);
  }
  await eventParticipantsCollection().deleteMany({ userId });
  await eventRequestsCollection().deleteMany({ userId });
};
