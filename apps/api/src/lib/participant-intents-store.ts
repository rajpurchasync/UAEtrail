import { randomUUID } from 'crypto';
import type { ExploreMapItemDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import {
  buildExploreFeaturedPerson,
  buildExploreMapPlanProjection,
  exploreDemandMapItemPath,
  exploreMapKindToPlanMapKind,
  demandFallbackTitle,
  participantIntentKindToOutingCategory,
  type OutingCategory,
} from '@uaetrail/shared-types';
import { ObjectId, type Filter } from 'mongodb';
import {
  parseMergedParticipantIntent,
  type CreateParticipantIntentInput,
  type ParticipantIntentKind,
  type UpdateParticipantIntentInput,
} from '../domain/participant-intent.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users.js';
import { ApiError } from './api-error.js';
import { invalidateExploreMapCache } from './explore-map-cache.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { ActivityStatus } from '../domain/enums.js';
import { batchShouldHideFromMapMemberDiscovery } from '../services/profile-viewer-access.js';

type MongoParticipantIntent = {
  _id: string;
  userId: string;
  kind: ParticipantIntentKind;
  outingCategory?: OutingCategory | null;
  title?: string | null;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific' | null;
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  comment: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  convertedActivityId?: string | null;
  /** Canonical published activity id (`activityMode: seeking`). */
  activityId?: string | null;
  /** @deprecated Mongo alias — prefer `activityId`; kept for pre-rename rows. */
  seekingActivityId?: string | null;
  areaId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS);

/** Map-published activity for an intent (seeking mode). Not the later `convertedActivityId` hosted link. */
export const resolveIntentPublishedActivityId = (
  doc: Pick<MongoParticipantIntent, 'activityId' | 'seekingActivityId'>
): string | null => doc.activityId ?? doc.seekingActivityId ?? null;

const mapExploreKind = (kind: ParticipantIntentKind): ExploreMapItemDTO['kind'] => {
  if (kind === 'guide' || kind === 'other') return 'event';
  return kind;
};

const resolveStoredDemandTitle = (doc: MongoParticipantIntent): string =>
  doc.title?.trim() || demandFallbackTitle(doc.kind);

const buildDemandRouteLabels = (
  doc: MongoParticipantIntent
): { fromLabel: string | null; toLabel: string | null } => {
  if (doc.kind !== 'rideshare') {
    return { fromLabel: null, toLabel: null };
  }

  if (doc.preferredArea?.includes('→')) {
    const [from, to] = doc.preferredArea.split('→').map((part) => part.trim());
    if (from && to) return { fromLabel: from, toLabel: to };
  }

  const fromLabel =
    doc.latitude != null && doc.longitude != null
      ? `${doc.latitude.toFixed(4)}, ${doc.longitude.toFixed(4)}`
      : doc.preferredArea?.trim() || null;
  const toLabel =
    doc.toLatitude != null && doc.toLongitude != null
      ? `${doc.toLatitude.toFixed(4)}, ${doc.toLongitude.toFixed(4)}`
      : null;

  return { fromLabel, toLabel };
};

const mapDto = (
  doc: MongoParticipantIntent,
  user?: { profile?: { displayName?: string | null; avatarUrl?: string | null } } | null
): ParticipantIntentDTO => ({
  id: doc._id,
  userId: doc.userId,
  kind: doc.kind,
  title: resolveStoredDemandTitle(doc),
  date: doc.date,
  time: doc.time,
  preferredArea: doc.preferredArea,
  latitude: doc.latitude,
  longitude: doc.longitude,
  locationPrecision: doc.locationPrecision,
  toLatitude: doc.toLatitude,
  toLongitude: doc.toLongitude,
  partySize: doc.partySize,
  comment: doc.comment,
  status: doc.status,
  convertedActivityId: doc.convertedActivityId ?? null,
  activityId: resolveIntentPublishedActivityId(doc),
  seekingActivityId: resolveIntentPublishedActivityId(doc),
  createdAt: doc.createdAt.toISOString(),
  requesterName: user?.profile?.displayName ?? null,
  requesterAvatar: user?.profile?.avatarUrl ?? null,
});

export const findParticipantIntentById = async (
  intentId: string
): Promise<ParticipantIntentDTO | null> => {
  const lookupFilter: Record<string, unknown> =
    /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
      ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
      : { _id: intentId };

  const doc = await collection().findOne(lookupFilter as Filter<MongoParticipantIntent>);
  if (doc) {
    const user = await findAuthUserById(doc.userId);
    return mapDto(doc, user);
  }

  const { findSeekingActivityByParticipantIntentId, activityDocToParticipantIntentDto } =
    await import('../services/participant-intent-activity-readthrough.js');
  const activity = await findSeekingActivityByParticipantIntentId(intentId);
  if (!activity) return null;

  const user = await findAuthUserById(activity.hostId ?? activity.createdById);
  return activityDocToParticipantIntentDto(activity, user);
};

export const createParticipantIntent = async (
  userId: string,
  input: CreateParticipantIntentInput
): Promise<ParticipantIntentDTO> => {
  const now = new Date();
  const areaId = input.areaId?.trim() ? input.areaId.trim() : null;
  if (input.latitude != null && input.longitude != null) {
    if (!areaId) {
      const { ApiError } = await import('./api-error.js');
      throw new ApiError(400, 'activity_area_required', 'Choose a curated area for this map post.');
    }
    const { findPublishedAreaById } = await import('./areas-store.js');
    const area = await findPublishedAreaById(areaId);
    if (!area) {
      const { ApiError } = await import('./api-error.js');
      throw new ApiError(400, 'area_not_found', 'Choose a published area.');
    }
  }
  const intentId = randomUUID();
  const { createSeekingActivityForIntent, cancelSeekingActivityForIntent } = await import(
    '../services/participant-intent-seeking-activity.js'
  );
  const publishedActivityId = await createSeekingActivityForIntent(userId, intentId, input, areaId);

  const { isParticipantIntentStubWriteEnabled, activityDocToParticipantIntentDto } = await import(
    '../services/participant-intent-activity-readthrough.js'
  );
  if (!isParticipantIntentStubWriteEnabled()) {
    await invalidateExploreMapCache();
    const { notifyMemberPublishSubscribers } = await import('../services/member-publish-notifications.js');
    void notifyMemberPublishSubscribers(userId, {
      publishType: 'demand',
      intentId,
      title: input.title.trim(),
      activityId: publishedActivityId,
    });
    if (areaId) {
      const { notifySeekerOfHostedActivitiesInArea } = await import(
        '../services/seeking-area-match-notifications.js'
      );
      void notifySeekerOfHostedActivitiesInArea({
        seekerUserId: userId,
        areaId,
        intentId,
        seekingActivityId: publishedActivityId,
        intentDate: input.date ?? null,
      });
    }
    const { findActivityDocInMongo } = await import('./entity-sync.js');
    const activity = await findActivityDocInMongo(publishedActivityId);
    if (!activity) {
      throw new Error('Seeking activity missing after create.');
    }
    const user = await findAuthUserById(userId);
    return activityDocToParticipantIntentDto(activity, user);
  }

  const doc: MongoParticipantIntent = {
    _id: intentId,
    userId,
    kind: input.kind,
    outingCategory: participantIntentKindToOutingCategory(input.kind),
    title: input.title.trim(),
    date: input.date ?? null,
    time: input.time ?? null,
    preferredArea: input.preferredArea?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    locationPrecision: input.locationPrecision ?? null,
    toLatitude: input.toLatitude ?? null,
    toLongitude: input.toLongitude ?? null,
    partySize: input.partySize,
    comment: input.comment.trim(),
    status: 'active',
    areaId,
    activityId: publishedActivityId,
    seekingActivityId: publishedActivityId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await collection().insertOne(doc);
  } catch (error) {
    await cancelSeekingActivityForIntent(publishedActivityId);
    throw error;
  }

  await invalidateExploreMapCache();
  const { notifyMemberPublishSubscribers } = await import('../services/member-publish-notifications.js');
  void notifyMemberPublishSubscribers(userId, {
    publishType: 'demand',
    intentId: doc._id,
    title: input.title.trim(),
    activityId: resolveIntentPublishedActivityId(doc),
  });
  if (areaId) {
    const { notifySeekerOfHostedActivitiesInArea } = await import(
      '../services/seeking-area-match-notifications.js'
    );
    void notifySeekerOfHostedActivitiesInArea({
      seekerUserId: userId,
      areaId,
      intentId: doc._id,
      seekingActivityId: resolveIntentPublishedActivityId(doc),
      intentDate: input.date ?? null,
    });
  }
  const user = await findAuthUserById(userId);
  return mapDto(doc, user);
};

export const participantIntentDocToCreateInput = (
  doc: MongoParticipantIntent
): CreateParticipantIntentInput => ({
  kind: doc.kind,
  title: doc.title?.trim() || resolveStoredDemandTitle(doc),
  date: doc.date,
  time: doc.time,
  preferredArea: doc.preferredArea,
  latitude: doc.latitude,
  longitude: doc.longitude,
  locationPrecision: doc.locationPrecision ?? undefined,
  toLatitude: doc.toLatitude,
  toLongitude: doc.toLongitude,
  partySize: doc.partySize,
  comment: doc.comment,
  areaId: doc.areaId ?? null,
});

export const updateParticipantIntent = async (
  userId: string,
  intentId: string,
  patch: UpdateParticipantIntentInput
): Promise<ParticipantIntentDTO | null> => {
  const lookupFilter: Record<string, unknown> =
    /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
      ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
      : { _id: intentId };

  const existing = await collection().findOne({
    ...lookupFilter,
    userId,
    status: 'active',
  } as Filter<MongoParticipantIntent>);

  if (!existing) {
    const {
      findSeekingActivityByParticipantIntentId,
      isSeekingActivityEditable,
      resolveSeekingActivityOwnerId,
      seekingActivityToCreateInput,
      activityDocToParticipantIntentDto,
    } = await import('../services/participant-intent-activity-readthrough.js');
    const activity = await findSeekingActivityByParticipantIntentId(intentId);
    if (!activity || resolveSeekingActivityOwnerId(activity) !== userId) return null;
    if (!isSeekingActivityEditable(activity)) return null;

    const merged = parseMergedParticipantIntent({
      ...seekingActivityToCreateInput(activity),
      ...patch,
      title: patch.title?.trim() ?? seekingActivityToCreateInput(activity).title,
    });

    const areaId =
      merged.areaId?.trim() ||
      (merged.latitude != null && merged.longitude != null ? activity.areaId ?? null : null);

    const { patchActivityInMongo } = await import('./entity-sync.js');
    const { parseLocalDateTime } = await import('./datetime.js');
    const startAt =
      merged.date != null
        ? parseLocalDateTime(merged.date, merged.time?.trim() || '09:00', 'AE')
        : undefined;
    await patchActivityInMongo(activity._id, {
      title: merged.title.trim(),
      description: merged.comment.trim(),
      capacity: merged.partySize,
      ...(startAt ? { startAt } : {}),
      meetingLat: merged.latitude ?? null,
      meetingLng: merged.longitude ?? null,
      meetingPoint: merged.preferredArea?.trim() || null,
      startLat: merged.toLatitude ?? null,
      startLng: merged.toLongitude ?? null,
      areaId,
    });

    await invalidateExploreMapCache();
    const { findActivityDocInMongo } = await import('./entity-sync.js');
    const refreshed = await findActivityDocInMongo(activity._id);
    if (!refreshed) return null;
    const user = await findAuthUserById(userId);
    return activityDocToParticipantIntentDto(refreshed, user);
  }

  const merged = parseMergedParticipantIntent({
    ...participantIntentDocToCreateInput(existing),
    ...patch,
    title: patch.title?.trim() ?? participantIntentDocToCreateInput(existing).title,
  });

  const now = new Date();
  const update: Partial<MongoParticipantIntent> = {
    kind: merged.kind,
    outingCategory: participantIntentKindToOutingCategory(merged.kind),
    title: merged.title.trim(),
    date: merged.date ?? null,
    time: merged.time ?? null,
    preferredArea: merged.preferredArea?.trim() || null,
    latitude: merged.latitude ?? null,
    longitude: merged.longitude ?? null,
    locationPrecision: merged.locationPrecision ?? null,
    toLatitude: merged.toLatitude ?? null,
    toLongitude: merged.toLongitude ?? null,
    partySize: merged.partySize,
    comment: merged.comment.trim(),
    updatedAt: now,
  };
  if (patch.areaId !== undefined) {
    update.areaId = patch.areaId?.trim() || null;
  } else if (update.latitude != null && update.longitude != null) {
    update.areaId = existing.areaId ?? null;
  } else {
    update.areaId = null;
  }

  const updated = await collection().findOneAndUpdate(
    { _id: existing._id, userId, status: 'active' } as Filter<MongoParticipantIntent>,
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!updated) return null;

  const publishedActivityId = resolveIntentPublishedActivityId(updated);
  if (publishedActivityId) {
    const { patchActivityInMongo } = await import('./entity-sync.js');
    const { parseLocalDateTime } = await import('./datetime.js');
    const startAt =
      merged.date != null
        ? parseLocalDateTime(merged.date, merged.time?.trim() || '09:00', 'AE')
        : undefined;
    await patchActivityInMongo(publishedActivityId, {
      title: merged.title.trim(),
      description: merged.comment.trim(),
      capacity: merged.partySize,
      ...(startAt ? { startAt } : {}),
      meetingLat: merged.latitude ?? null,
      meetingLng: merged.longitude ?? null,
      startLat: merged.toLatitude ?? null,
      startLng: merged.toLongitude ?? null,
      areaId: update.areaId ?? null,
    });
  }

  await invalidateExploreMapCache();
  const user = await findAuthUserById(userId);
  return mapDto(updated, user);
};

export const cancelParticipantIntent = async (
  userId: string,
  intentId: string
): Promise<ParticipantIntentDTO | null> => {
  const lookupFilter: Record<string, unknown> =
    /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
      ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
      : { _id: intentId };

  const updated = await collection().findOneAndUpdate(
    { ...lookupFilter, userId, status: 'active' } as Filter<MongoParticipantIntent>,
    { $set: { status: 'cancelled', updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const {
      findSeekingActivityByParticipantIntentId,
      isSeekingActivityEditable,
      resolveSeekingActivityOwnerId,
      activityDocToParticipantIntentDto,
    } = await import('../services/participant-intent-activity-readthrough.js');
    const activity = await findSeekingActivityByParticipantIntentId(intentId);
    if (!activity || resolveSeekingActivityOwnerId(activity) !== userId) return null;
    if (!isSeekingActivityEditable(activity)) return null;

    const { cancelSeekingActivityForIntent } = await import(
      '../services/participant-intent-seeking-activity.js'
    );
    await cancelSeekingActivityForIntent(activity._id);

    await invalidateExploreMapCache();
    const { findActivityDocInMongo } = await import('./entity-sync.js');
    const refreshed = await findActivityDocInMongo(activity._id);
    if (!refreshed) return null;
    const user = await findAuthUserById(userId);
    return activityDocToParticipantIntentDto(refreshed, user);
  }

  const { cancelSeekingActivityForIntent } = await import(
    '../services/participant-intent-seeking-activity.js'
  );
  await cancelSeekingActivityForIntent(resolveIntentPublishedActivityId(updated));

  await invalidateExploreMapCache();
  const user = await findAuthUserById(updated.userId);
  return mapDto(updated, user);
};

/** Poster links their published activity to close the demand pin. */
export const linkParticipantIntentToActivityForOwner = async (
  intentId: string,
  ownerUserId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const { findActivityDocInMongo } = await import('./entity-sync.js');
  const activity = await findActivityDocInMongo(activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const activityOwnerId = activity.hostId ?? activity.createdById;
  if (activityOwnerId !== ownerUserId) {
    throw new ApiError(403, 'not_activity_owner', 'You can only link your own published outing.');
  }

  const lookupFilter: Record<string, unknown> =
    /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
      ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
      : { _id: intentId };

  const intent = await collection().findOne({
    ...lookupFilter,
    userId: ownerUserId,
    status: 'active',
  } as Filter<MongoParticipantIntent>);

  if (!intent) {
    const {
      findSeekingActivityByParticipantIntentId,
      isSeekingActivityEditable,
      resolveSeekingActivityOwnerId,
    } = await import('../services/participant-intent-activity-readthrough.js');
    const seeking = await findSeekingActivityByParticipantIntentId(intentId);
    if (
      !seeking ||
      resolveSeekingActivityOwnerId(seeking) !== ownerUserId ||
      !isSeekingActivityEditable(seeking)
    ) {
      throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
    }
  }

  return fulfillParticipantIntent(intentId, activityId);
};

export const fulfillParticipantIntent = async (
  intentId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  const lookupFilter: Record<string, unknown> =
    /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
      ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
      : { _id: intentId };

  const updated = await getMongoClient()!
    .db()
    .collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS)
    .findOneAndUpdate(
      { ...lookupFilter, status: 'active' } as Filter<MongoParticipantIntent>,
      {
        $set: {
          status: 'fulfilled',
          convertedActivityId: activityId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

  if (updated) {
    const { cancelSeekingActivityForIntent } = await import(
      '../services/participant-intent-seeking-activity.js'
    );
    await cancelSeekingActivityForIntent(resolveIntentPublishedActivityId(updated));

    const { carryApprovedDemandJoinersToActivity } = await import(
      '../services/participant-intent-carryover.js'
    );
    await carryApprovedDemandJoinersToActivity({
      intentId: updated._id,
      activityId,
      hostUserId: updated.userId,
    });

    const user = await findAuthUserById(updated.userId);
    return mapDto(updated, user);
  }

  const {
    findSeekingActivityByParticipantIntentId,
    isSeekingActivityEditable,
    activityDocToParticipantIntentDto,
  } = await import('../services/participant-intent-activity-readthrough.js');
  const seeking = await findSeekingActivityByParticipantIntentId(intentId);
  if (!seeking || !isSeekingActivityEditable(seeking)) return null;

  const hostUserId = seeking.hostId ?? seeking.createdById;
  const { patchActivityInMongo } = await import('./entity-sync.js');
  await patchActivityInMongo(seeking._id, {
    status: ActivityStatus.CANCELLED,
    seekingConvertedActivityId: activityId,
  });

  const { carryApprovedDemandJoinersToActivity } = await import(
    '../services/participant-intent-carryover.js'
  );
  await carryApprovedDemandJoinersToActivity({
    intentId,
    activityId,
    hostUserId,
  });

  await invalidateExploreMapCache();
  const { findActivityDocInMongo } = await import('./entity-sync.js');
  const refreshed = await findActivityDocInMongo(seeking._id);
  if (!refreshed) return null;
  const user = await findAuthUserById(hostUserId);
  return activityDocToParticipantIntentDto(refreshed, user);
};

export const listParticipantIntentsForUser = async (
  userId: string,
  limit = 100
): Promise<ParticipantIntentDTO[]> => {
  const docs = await collection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const {
    listSeekingActivitiesForOwner,
    activityDocToParticipantIntentDto,
    isParticipantIntentStubWriteEnabled,
  } = await import('../services/participant-intent-activity-readthrough.js');

  const user = await findAuthUserById(userId);
  const fromIntents = docs.map((doc) => mapDto(doc, user));
  const intentIds = new Set(fromIntents.map((row) => row.id));

  const activityOnly =
    isParticipantIntentStubWriteEnabled()
      ? []
      : (await listSeekingActivitiesForOwner(userId, limit))
          .filter((activity) => activity.participantIntentId && !intentIds.has(activity.participantIntentId))
          .map((activity) => activityDocToParticipantIntentDto(activity, user));

  const merged = [...fromIntents, ...activityOnly].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return merged.slice(0, limit);
};

/**
 * @deprecated M0 map projection — explore map reads seeking pins from `activities` only (M1).
 * Kept for unit tests and emergency tooling; run `backfill-seeking-activities` in each env.
 */
export const listActiveParticipantIntentsForMap = async (limit = 200): Promise<ExploreMapItemDTO[]> => {
  const docs = await collection()
    .find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (docs.length === 0) return [];

  const userIds = [...new Set(docs.map((doc) => doc.userId))];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  const hideFromMapByUserId = await batchShouldHideFromMapMemberDiscovery(userIds, userMap);

  return docs
    .filter((doc) => !resolveIntentPublishedActivityId(doc))
    .filter((doc) => doc.latitude != null && doc.longitude != null)
    .filter((doc) => !hideFromMapByUserId.get(doc.userId))
    .map((doc) => {
      const user = userMap.get(doc.userId);
      const route = buildDemandRouteLabels(doc);
      const planTitle = resolveStoredDemandTitle(doc);
      const mapKind = mapExploreKind(doc.kind);
      return {
        id: `demand:${doc._id}`,
        kind: mapKind,
        source: 'activity' as const,
        activityMode: 'seeking' as const,
        ...buildExploreMapPlanProjection({
          source: 'activity',
          activityMode: 'seeking',
          mapKind: exploreMapKindToPlanMapKind(mapKind),
          demandIntentKind: doc.kind,
          storedOutingCategory: doc.outingCategory ?? null,
        }),
        title: planTitle,
        subtitle:
          doc.kind === 'rideshare' && route.fromLabel && route.toLabel
            ? `${route.fromLabel} → ${route.toLabel}`
            : doc.preferredArea || doc.comment.slice(0, 80),
        latitude: doc.latitude,
        longitude: doc.longitude,
        toLatitude: doc.toLatitude,
        toLongitude: doc.toLongitude,
        fromLabel: route.fromLabel,
        toLabel: route.toLabel,
        path: exploreDemandMapItemPath(doc._id),
        featuredPerson: buildExploreFeaturedPerson({
          userId: doc.userId,
          displayName: user?.profile?.displayName ?? 'Someone',
          avatarUrl: user?.profile?.avatarUrl ?? null,
          role: 'requester',
        }),
        requesterUserId: doc.userId,
        participantIntentId: doc._id,
        date: doc.date,
        time: doc.time,
        slotsTotal: doc.partySize,
        areaId: doc.areaId ?? null,
      };
    });
};

/** Batch non-cancelled intent rows (stub-write path — no activity readthrough). */
export const countNonCancelledParticipantIntentsByUserIds = async (
  userIds: string[]
): Promise<Map<string, number>> => {
  const unique = [...new Set(userIds.filter(Boolean))];
  const counts = new Map<string, number>();
  if (unique.length === 0) return counts;
  for (const userId of unique) counts.set(userId, 0);

  const rows = await collection()
    .aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: unique }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ])
    .toArray();
  for (const row of rows) {
    counts.set(row._id, row.count);
  }
  return counts;
};

/** Non-cancelled demand posts — counts toward community Host label. */
export const countParticipantIntentsByUser = async (userId: string): Promise<number> => {
  const intentCount = await collection().countDocuments({ userId, status: { $ne: 'cancelled' } });
  const { isParticipantIntentStubWriteEnabled, listSeekingActivitiesForOwner } = await import(
    '../services/participant-intent-activity-readthrough.js'
  );
  if (isParticipantIntentStubWriteEnabled()) return intentCount;

  const activities = await listSeekingActivitiesForOwner(userId, 500);
  const intentIds = new Set(
    (
      await collection()
        .find({ userId }, { projection: { _id: 1 } })
        .toArray()
    ).map((doc) => doc._id)
  );
  const activityOnlyCount = activities.filter(
    (activity) =>
      activity.participantIntentId &&
      !intentIds.has(activity.participantIntentId) &&
      activity.status !== ActivityStatus.CANCELLED &&
      !activity.seekingConvertedActivityId
  ).length;
  return intentCount + activityOnlyCount;
};

/** M1 backfill — active intents without published `activityId` (pre-dual-write rows). */
export const backfillSeekingActivitiesForActiveIntents = async (options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<{ scanned: number; created: number; skipped: number; errors: string[] }> => {
  const limit = options?.limit ?? 500;
  const docs = await collection()
    .find({
      status: 'active',
      $and: [
        { $or: [{ activityId: { $exists: false } }, { activityId: null }] },
        { $or: [{ seekingActivityId: { $exists: false } }, { seekingActivityId: null }] },
      ],
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  const { createSeekingActivityForIntent } = await import(
    '../services/participant-intent-seeking-activity.js'
  );

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    if (doc.latitude == null || doc.longitude == null) {
      skipped += 1;
      continue;
    }

    if (options?.dryRun) {
      created += 1;
      continue;
    }

    const input = participantIntentDocToCreateInput(doc);
    try {
      const publishedActivityId = await createSeekingActivityForIntent(
        doc.userId,
        doc._id,
        input,
        doc.areaId ?? null,
        { deferCacheInvalidate: true }
      );
      await collection().updateOne(
        { _id: doc._id },
        {
          $set: {
            activityId: publishedActivityId,
            seekingActivityId: publishedActivityId,
            updatedAt: new Date(),
          },
        }
      );
      created += 1;
    } catch (error) {
      errors.push(`${doc._id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!options?.dryRun && created > 0) {
    await invalidateExploreMapCache();
  }

  return { scanned: docs.length, created, skipped, errors };
};
