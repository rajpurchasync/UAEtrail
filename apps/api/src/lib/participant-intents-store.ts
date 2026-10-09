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
import { shouldHideFromMapMemberDiscovery } from '../services/profile-viewer-access.js';

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
  areaId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS);

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
  if (!doc) return null;

  const user = await findAuthUserById(doc.userId);
  return mapDto(doc, user);
};

export const createParticipantIntent = async (
  userId: string,
  input: CreateParticipantIntentInput
): Promise<ParticipantIntentDTO> => {
  const now = new Date();
  let areaId: string | null = null;
  if (input.latitude != null && input.longitude != null) {
    const { resolveAreaIdForCoordinates } = await import('./area-resolution.js');
    areaId = await resolveAreaIdForCoordinates(input.latitude, input.longitude, null);
  }
  const doc: MongoParticipantIntent = {
    _id: randomUUID(),
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
    createdAt: now,
    updatedAt: now,
  };

  await collection().insertOne(doc);
  await invalidateExploreMapCache();
  const { notifyMemberPublishSubscribers } = await import('../services/member-publish-notifications.js');
  void notifyMemberPublishSubscribers(userId, {
    publishType: 'demand',
    intentId: doc._id,
    title: input.title.trim(),
  });
  const user = await findAuthUserById(userId);
  return mapDto(doc, user);
};

const mongoDocToCreateInput = (doc: MongoParticipantIntent): CreateParticipantIntentInput => ({
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

  if (!existing) return null;

  const merged = parseMergedParticipantIntent({
    ...mongoDocToCreateInput(existing),
    ...patch,
    title: patch.title?.trim() ?? mongoDocToCreateInput(existing).title,
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
  if (update.latitude != null && update.longitude != null) {
    const { resolveAreaIdForCoordinates } = await import('./area-resolution.js');
    update.areaId = await resolveAreaIdForCoordinates(update.latitude, update.longitude, null);
  } else {
    update.areaId = null;
  }

  const updated = await collection().findOneAndUpdate(
    { _id: existing._id, userId, status: 'active' } as Filter<MongoParticipantIntent>,
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!updated) return null;

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

  if (!updated) return null;

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
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
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

  if (!updated) return null;

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

  if (docs.length === 0) return [];

  const user = await findAuthUserById(userId);
  return docs.map((doc) => mapDto(doc, user));
};

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

  const hideFromMapByUserId = new Map<string, boolean>();
  await Promise.all(
    userIds.map(async (userId) => {
      const user = userMap.get(userId);
      const hidden = await shouldHideFromMapMemberDiscovery(
        userId,
        user?.profile?.profileVisibility
      );
      hideFromMapByUserId.set(userId, hidden);
    })
  );

  return docs
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
          source: 'demand',
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

/** Non-cancelled demand posts — counts toward community Host label. */
export const countParticipantIntentsByUser = async (userId: string): Promise<number> =>
  collection().countDocuments({ userId, status: { $ne: 'cancelled' } });
