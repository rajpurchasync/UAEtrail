import type { Collection } from 'mongodb';
import {
  ActivityStatus,
  NotificationType,
  RequestStatus,
  type MembershipRole
} from '../domain/enums.js';
import type { ActivityParticipant, ActivityRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { assertCapacityAvailable } from '../domain/capacity.js';
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
import { parseStoredPricePackages } from './trip-pricing.js';
import { dispatchNotificationDefault } from '../services/notifications.js';

const ACTIVE_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'WAITLISTED'];

export const isActivityFull = (capacity: number, participantCount: number): boolean =>
  participantCount >= capacity;

export function assertCanApproveRequest(capacity: number, participantCount: number): void {
  assertCapacityAvailable(capacity, participantCount);
}

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

  const packages = parseStoredPricePackages(event.pricePackages);
  if (packages.length > 1) {
    if (opts.selectedPackageIndex === undefined) {
      throw new ApiError(400, 'package_required', 'Select a package option to join this trip.');
    }
    if (opts.selectedPackageIndex < 0 || opts.selectedPackageIndex >= packages.length) {
      throw new ApiError(400, 'invalid_package', 'Selected package is not valid for this trip.');
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

  await dispatchNotificationDefault({
    userId: next.userId,
    title: 'A spot opened up!',
    body: 'Your waitlisted trip now has availability. Your request is pending organizer approval.',
    type: NotificationType.REQUEST_UPDATE,
    meta: { activityId, requestId: next._id, fromWaitlist: true }
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

  const eventIds = await activityParticipantsCollection().distinct('activityId', { userId: userA });
  if (eventIds.length > 0) {
    const shared = await activityParticipantsCollection().findOne({
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
}) => {
  const tenantEvents = await activitiesCollection()
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

export const countTenantActivityRequests = async (tenantId: string): Promise<number> => {
  const tenantEvents = await activitiesCollection().find({ tenantId }, { projection: { _id: 1 } }).toArray();
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
    const eventDoc = await findActivityDocInMongo(input.activityId);
    if (!eventDoc || eventDoc.status !== ActivityStatus.PUBLISHED) {
      throw new ApiError(400, 'event_not_publishable', 'Event must be published before approval.');
    }

    if (eventDoc.participantSlotsUsed === undefined) {
      const participantCount = await activityParticipantsCollection().countDocuments({ activityId: input.activityId });
      await patchActivityInMongo(input.activityId, { participantSlotsUsed: participantCount });
    }

    const reserved = await tryReserveActivityParticipantSlot(input.activityId, ActivityStatus.PUBLISHED);
    if (!reserved) {
      throw new ApiError(400, 'activity_full', 'Activity capacity has already been reached.');
    }

    const participantId = newEntityId();
    try {
      await patchActivityRequestInMongo(input.requestId, {
        status: RequestStatus.APPROVED,
        organizerNote: input.organizerNote ?? null,
        reviewedById: input.reviewerId,
        reviewedAt
      });
      await activityParticipantsCollection().updateOne(
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
      await releaseActivityParticipantSlot(input.activityId);
      throw error;
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
  }
  await promoteNextWaitlisted(input.activityId);
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
