import type { Collection } from 'mongodb';
import {
  ActivityStatus,
  RequestStatus,
  type MembershipRole,
} from '../domain/enums.js';
import type { ActivityParticipant, ActivityRequest } from '../domain/types.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import {
  findActivityDocInMongo,
  findLocationInMongo,
  findLocationsByIds,
} from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import {
  activitiesCollection,
  activityParticipantsCollection,
  activityRequestsCollection,
  isActivityFull,
  isEventHost,
  toActivityParticipantRecord,
  toActivityRequestRecord,
} from './activity-engagement-store-internals.js';
export {
  applyAdultFamilyInviteAccepted,
  applyAdultFamilyInviteDeclined,
  createJoinOrWaitlistRequest,
  createRsvpParticipation,
  updateActivityRequestNote,
  updateActivityRequestParty,
} from './activity-engagement-join-writes.js';
export {
  applyTenantActivityRequestDecision,
  cancelUserActivityRequestAndPromoteWaitlist,
  enrollHostApprovedActivityParticipant,
  purgeUserActivityEngagement,
  revokeHostActivityParticipant,
  setHostParticipantRating,
} from './activity-engagement-host-writes.js';
export {
  type EnrollHostApprovedActivityParticipantResult,
} from './activity-engagement-host-writes.js';
export {
  findActivityParticipantByEventAndUser,
  findActivityParticipantByIdAndActivity,
  findActivityRequestByEventAndUser,
  findActivityRequestByIdAndActivity,
  findActivityRequestByIdForUser,
  clearActivityParticipantCheckIn,
  listActivityEngagementForUserOnActivities,
} from './activity-engagement-store-reads.js';
export { isActivityFull };



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

/** Pending/waitlisted join requests on upcoming outings (excludes confirmed participants). */
export const countUserUpcomingPendingJoinRequests = async (userId: string): Promise<number> => {
  const pendingStatuses: RequestStatus[] = [RequestStatus.PENDING, RequestStatus.WAITLISTED];
  const requestRows = await activityRequestsCollection()
    .find({ userId, status: { $in: pendingStatuses } })
    .project({ activityId: 1 })
    .toArray();
  if (requestRows.length === 0) return 0;

  const activityIds = [...new Set(requestRows.map((row) => row.activityId))];
  const participantRows = await activityParticipantsCollection()
    .find({ userId, activityId: { $in: activityIds } })
    .project({ activityId: 1 })
    .toArray();
  const confirmedIds = new Set(participantRows.map((row) => row.activityId));
  const pendingActivityIds = activityIds.filter((id) => !confirmedIds.has(id));
  if (pendingActivityIds.length === 0) return 0;

  const { listActivitiesForRequestViews } = await import('./activities-store.js');
  const activities = await listActivitiesForRequestViews(pendingActivityIds);
  const { formatActivityLocal } = await import('./datetime.js');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingIds = new Set<string>();
  for (const activity of activities) {
    const day = formatActivityLocal(activity.startAt, 'AE').date.slice(0, 10);
    if (new Date(day) >= today) upcomingIds.add(activity.id);
  }

  return pendingActivityIds.filter((id) => upcomingIds.has(id)).length;
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

/** Cheap fingerprint for `GET /me/activities` conditional refresh (count + latest timestamps). */
export const readUserParticipationRevision = async (userId: string): Promise<string> => {
  const [row] = await activityParticipantsCollection()
    .aggregate<{ n?: number; created?: Date | null; checked?: Date | null }>([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          created: { $max: '$createdAt' },
          checked: { $max: '$checkedInAt' },
        },
      },
    ])
    .toArray();
  const created = row?.created ? new Date(row.created).toISOString() : '';
  const checked = row?.checked ? new Date(row.checked).toISOString() : '';
  return `${row?.n ?? 0}|${created}|${checked}`;
};

export const countUserCheckedInParticipations = async (userId: string): Promise<number> =>
  activityParticipantsCollection().countDocuments({ userId, checkedInAt: { $ne: null } });

export const countCheckedInParticipationsForUserIds = async (
  userIds: string[]
): Promise<Map<string, number>> => {
  const unique = [...new Set(userIds.filter(Boolean))];
  const counts = new Map<string, number>();
  for (const userId of unique) counts.set(userId, 0);
  if (unique.length === 0) return counts;

  const rows = await activityParticipantsCollection()
    .aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: unique }, checkedInAt: { $ne: null } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ])
    .toArray();

  for (const row of rows) counts.set(row._id, row.count);
  return counts;
};

export const countPublishedActivitiesHostedByUser = async (userId: string): Promise<number> =>
  activitiesCollection().countDocuments({
    status: ActivityStatus.PUBLISHED,
    $or: [{ hostId: userId }, { createdById: userId }],
  });

export const countPublishedActivitiesHostedByUserIds = async (
  userIds: string[]
): Promise<Map<string, number>> => {
  const unique = [...new Set(userIds.filter(Boolean))];
  const counts = new Map<string, number>();
  for (const userId of unique) counts.set(userId, 0);
  if (unique.length === 0) return counts;

  const rows = await activitiesCollection()
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          status: ActivityStatus.PUBLISHED,
          $or: [{ hostId: { $in: unique } }, { createdById: { $in: unique } }],
        },
      },
      {
        $project: {
          owners: {
            $filter: {
              input: { $setUnion: [['$hostId'], ['$createdById']] },
              cond: { $and: [{ $ne: ['$$this', null] }, { $in: ['$$this', unique] }] },
            },
          },
        },
      },
      { $unwind: '$owners' },
      { $group: { _id: '$owners', activityIds: { $addToSet: '$_id' } } },
      { $project: { _id: 1, count: { $size: '$activityIds' } } },
    ])
    .toArray();

  for (const row of rows) {
    if (row._id) counts.set(row._id, row.count);
  }
  return counts;
};

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
  hostMembershipRoles: MembershipRole[];
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

    if (await isEventHost(event, otherUserId, input.hostMembershipRoles)) {
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
    hostMembershipRoles: MembershipRole[];
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
    if (await isEventHost(event, hostUserId, input.hostMembershipRoles)) {
      return true;
    }
  }

  return false;
};

export const hasParticipantToHostLink = async (input: {
  participantUserId: string;
  hostUserId: string;
  hostMembershipRoles: MembershipRole[];
}): Promise<boolean> => {
  const participants = await activityParticipantsCollection().find({ userId: input.participantUserId }).toArray();
  for (const participant of participants) {
    const event = await findActivityDocInMongo(participant.activityId);
    if (!event) continue;
    if (await isEventHost(event, input.hostUserId, input.hostMembershipRoles)) {
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

type ActivityHostFields = {
  _id: string;
  tenantId?: string;
  hostId?: string | null;
  createdById?: string;
};

const loadActivityHostFieldsByIds = async (activityIds: string[]): Promise<Map<string, ActivityHostFields>> => {
  if (activityIds.length === 0) return new Map();
  const docs = await getMongoClient()!
    .db()
    .collection<ActivityHostFields>('activities')
    .find(
      { _id: { $in: activityIds } },
      { projection: { _id: 1, tenantId: 1, hostId: 1, createdById: 1 } }
    )
    .toArray();
  return new Map(docs.map((doc) => [doc._id, doc]));
};

const buildActivityHostKeys = async (
  events: ActivityHostFields[],
  userIds: string[],
  hostMembershipRoles: MembershipRole[]
): Promise<Set<string>> => {
  const keys = new Set<string>();
  const membershipPairs = new Map<string, { tenantId: string; userId: string }>();

  for (const event of events) {
    for (const userId of userIds) {
      if (event.hostId === userId || event.createdById === userId) {
        keys.add(`${event._id}:${userId}`);
        continue;
      }
      if (event.tenantId) {
        membershipPairs.set(`${event.tenantId}:${userId}`, { tenantId: event.tenantId, userId });
      }
    }
  }

  if (membershipPairs.size === 0) return keys;

  const tenantIds = [...new Set([...membershipPairs.values()].map((pair) => pair.tenantId))];
  const checkUserIds = [...new Set([...membershipPairs.values()].map((pair) => pair.userId))];

  const memberships = await getMongoClient()!
    .db()
    .collection('tenant_memberships')
    .find({
      tenantId: { $in: tenantIds },
      userId: { $in: checkUserIds },
      role: { $in: hostMembershipRoles },
    })
    .toArray();

  const memberSet = new Set(memberships.map((row) => `${row.tenantId}:${row.userId}`));

  for (const event of events) {
    if (!event.tenantId) continue;
    for (const userId of userIds) {
      if (keys.has(`${event._id}:${userId}`)) continue;
      if (memberSet.has(`${event.tenantId}:${userId}`)) {
        keys.add(`${event._id}:${userId}`);
      }
    }
  }

  return keys;
};

/**
 * Inbox batch: same rules as chat canMessageUser (no activityId inquiry), for viewer → many partners.
 */
export const batchCanMessagePartnersFromViewer = async (input: {
  viewerId: string;
  partnerIds: string[];
  hostMembershipRoles: MembershipRole[];
  activeStatuses: RequestStatus[];
}): Promise<Set<string>> => {
  const partners = [...new Set(input.partnerIds.filter((id) => id && id !== input.viewerId))];
  if (partners.length === 0) return new Set();

  const allowed = new Set<string>();
  const partnerSet = new Set(partners);

  const viewerParticipation = await activityParticipantsCollection()
    .find({ userId: input.viewerId }, { projection: { activityId: 1 } })
    .toArray();
  const viewerActivityIds = [...new Set(viewerParticipation.map((row) => row.activityId))];
  if (viewerActivityIds.length > 0) {
    const sharedRows = await activityParticipantsCollection()
      .find(
        { activityId: { $in: viewerActivityIds }, userId: { $in: partners } },
        { projection: { userId: 1 } }
      )
      .toArray();
    for (const row of sharedRows) {
      if (partnerSet.has(row.userId)) allowed.add(row.userId);
    }
  }

  let remaining = partners.filter((id) => !allowed.has(id));
  if (remaining.length === 0) return allowed;

  const relatedUserIds = [input.viewerId, ...remaining];
  const participantRows = await activityParticipantsCollection()
    .find({ userId: { $in: relatedUserIds } }, { projection: { userId: 1, activityId: 1 } })
    .toArray();

  const activityIds = [...new Set(participantRows.map((row) => row.activityId))];
  const eventById = await loadActivityHostFieldsByIds(activityIds);
  const hostUserIds = [input.viewerId, ...remaining];
  const activityHostKeys = await buildActivityHostKeys([...eventById.values()], hostUserIds, input.hostMembershipRoles);

  const isActivityHostOnEvent = (activityId: string, userId: string) =>
    activityHostKeys.has(`${activityId}:${userId}`);
  const isDirectHost = (activityId: string, userId: string) => {
    const event = eventById.get(activityId);
    if (!event) return false;
    return event.hostId === userId || event.createdById === userId;
  };

  const viewerActivities = new Set(
    participantRows.filter((row) => row.userId === input.viewerId).map((row) => row.activityId)
  );
  const partnerActivities = new Map<string, Set<string>>();
  for (const row of participantRows) {
    if (!partnerSet.has(row.userId)) continue;
    const set = partnerActivities.get(row.userId) ?? new Set<string>();
    set.add(row.activityId);
    partnerActivities.set(row.userId, set);
  }

  for (const partnerId of remaining) {
    let ok = false;
    for (const activityId of viewerActivities) {
      if (isActivityHostOnEvent(activityId, partnerId)) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      const partnerActivityIds = partnerActivities.get(partnerId);
      if (partnerActivityIds) {
        for (const activityId of partnerActivityIds) {
          if (isDirectHost(activityId, input.viewerId)) {
            ok = true;
            break;
          }
        }
      }
    }
    if (ok) allowed.add(partnerId);
  }

  remaining = partners.filter((id) => !allowed.has(id));
  if (remaining.length === 0) return allowed;

  const requests = await activityRequestsCollection()
    .find({
      status: { $in: input.activeStatuses },
      userId: { $in: [input.viewerId, ...remaining] },
    })
    .toArray();

  const missingActivityIds = [...new Set(requests.map((row) => row.activityId))].filter((id) => !eventById.has(id));
  if (missingActivityIds.length > 0) {
    const loaded = await loadActivityHostFieldsByIds(missingActivityIds);
    for (const [id, event] of loaded) eventById.set(id, event);
  }

  const requestHostKeys = await buildActivityHostKeys([...eventById.values()], hostUserIds, input.hostMembershipRoles);
  const isRequestActivityHost = (activityId: string, userId: string) =>
    requestHostKeys.has(`${activityId}:${userId}`);

  for (const partnerId of remaining) {
    for (const request of requests) {
      const requestUserId = request.userId;
      if (requestUserId !== input.viewerId && requestUserId !== partnerId) continue;
      const otherUserId = requestUserId === input.viewerId ? partnerId : input.viewerId;
      if (isRequestActivityHost(request.activityId, otherUserId)) {
        allowed.add(partnerId);
        break;
      }
    }
  }

  return allowed;
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
  hostMembershipRoles: MembershipRole[];
}): Promise<boolean> => {
  const event = await findActivityDocInMongo(input.activityId);
  if (!event || event.status !== ActivityStatus.PUBLISHED) return false;
  return isEventHost(event, input.receiverId, input.hostMembershipRoles);
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
    .find(eventFilter, {
      projection: {
        _id: 1,
        title: 1,
        startAt: 1,
        locationId: 1,
        activityType: 1,
        requirements: 1,
        audience: 1,
      },
    })
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
        locationId: event.locationId,
        activityType: event.activityType ?? 'hiking',
        requirements: (() => {
          const raw = event as unknown as { requirements?: string[] };
          return Array.isArray(raw.requirements) ? raw.requirements : [];
        })(),
        audience:
          (event as unknown as { audience?: { minAge?: number | null; womenOnly?: boolean } | null })
            .audience ?? null,
      },
    ])
  );

  const locationIds = [...new Set(tenantEvents.map((event) => event.locationId))];
  const locationMap = await findLocationsByIds(locationIds);

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
        profile: user?.profile ?? null
      },
      activity: {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        activityType: event.activityType,
        requirements: event.requirements,
        audience: event.audience,
        location: location ?? { id: event.locationId, name: '' },
      },
    };
  });
};

export const countTenantPendingJoinRequests = async (tenantId: string): Promise<number> => {
  const tenantEvents = await activitiesCollection()
    .find({ tenantId }, { projection: { _id: 1 } })
    .toArray();
  const eventIds = tenantEvents.map((event) => event._id);
  if (eventIds.length === 0) return 0;
  return activityRequestsCollection().countDocuments({
    activityId: { $in: eventIds },
    status: RequestStatus.PENDING,
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
              avatarUrl: user.profile.avatarUrl,
              bloodGroup: user.profile.bloodGroup ?? null,
              medicalConditions: user.profile.medicalConditions ?? null,
              emergencyContactName: user.profile.emergencyContactName ?? null,
              emergencyContactPhone: user.profile.emergencyContactPhone ?? null,
              emergencyContactRelation: user.profile.emergencyContactRelation ?? null,
            }
          : null
      }
    };
  });
};

