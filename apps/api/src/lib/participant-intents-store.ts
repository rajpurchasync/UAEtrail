import type { ExploreMapItemDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { buildExploreFeaturedPerson, demandFallbackTitle } from '@uaetrail/shared-types';
import { ObjectId } from 'mongodb';
import type { CreateParticipantIntentInput, ParticipantIntentKind } from '../domain/participant-intent.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users.js';
import { invalidateExploreMapCache } from './explore-map-cache.js';
import { getMongoClient } from './mongo.js';
import { shouldHideFromMapMemberDiscovery } from '../services/profile-viewer-access.js';

const COLLECTION = 'participant_intents';

type MongoParticipantIntent = {
  _id: ObjectId;
  userId: string;
  kind: ParticipantIntentKind;
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
  createdAt: Date;
  updatedAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTION);

const stringifyDocId = (id: ObjectId | string): string =>
  typeof id === 'string' ? id : id.toHexString();

const mapExploreKind = (kind: ParticipantIntentKind): ExploreMapItemDTO['kind'] => {
  if (kind === 'guide' || kind === 'other') return 'event';
  return kind;
};

const resolveStoredDemandTitle = (doc: MongoParticipantIntent): string =>
  doc.title?.trim() || demandFallbackTitle(doc.kind);

const buildDemandRouteLabels = (
  doc: MongoParticipantIntent
): { fromLabel: string | null; toLabel: string | null } => {
  if (doc.kind !== 'carpool') {
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
  id: stringifyDocId(doc._id),
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

export const createParticipantIntent = async (
  userId: string,
  input: CreateParticipantIntentInput
): Promise<ParticipantIntentDTO> => {
  const now = new Date();
  const doc: MongoParticipantIntent = {
    _id: new ObjectId(),
    userId,
    kind: input.kind,
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
    createdAt: now,
    updatedAt: now,
  };

  await collection().insertOne(doc);
  await invalidateExploreMapCache();
  const user = await findAuthUserById(userId);
  return mapDto(doc, user);
};

export const fulfillParticipantIntent = async (
  intentId: string,
  activityId: string
): Promise<ParticipantIntentDTO | null> => {
  if (!ObjectId.isValid(intentId)) return null;

  const updated = await collection().findOneAndUpdate(
    { _id: new ObjectId(intentId), status: 'active' },
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

  const user = await findAuthUserById(updated.userId);
  return mapDto(updated, user);
};

const demandExplorePath = (kind: ParticipantIntentKind): string => {
  const filterByKind: Partial<Record<ParticipantIntentKind, string>> = {
    hiking: 'hiking',
    camping: 'camping',
    carpool: 'carpool',
    event: 'others',
    guide: 'others',
    other: 'others',
  };
  const params = new URLSearchParams({ list: '1', panel: 'activities' });
  const filter = filterByKind[kind];
  if (filter) params.set('filter', filter);
  return `/explore?${params.toString()}`;
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
      const displayName = user?.profile?.displayName ?? 'Someone';
      const route = buildDemandRouteLabels(doc);
      const planTitle = resolveStoredDemandTitle(doc);
      return {
        id: `demand:${stringifyDocId(doc._id)}`,
        kind: mapExploreKind(doc.kind),
        source: 'demand' as const,
        title: planTitle,
        subtitle:
          doc.kind === 'carpool' && route.fromLabel && route.toLabel
            ? `${route.fromLabel} → ${route.toLabel}`
            : doc.preferredArea || doc.comment.slice(0, 80),
        latitude: doc.latitude,
        longitude: doc.longitude,
        toLatitude: doc.toLatitude,
        toLongitude: doc.toLongitude,
        fromLabel: route.fromLabel,
        toLabel: route.toLabel,
        path: demandExplorePath(doc.kind),
        featuredPerson: buildExploreFeaturedPerson({
          userId: doc.userId,
          displayName: user?.profile?.displayName ?? 'Someone',
          avatarUrl: user?.profile?.avatarUrl ?? null,
          role: 'requester',
        }),
        requesterUserId: doc.userId,
        participantIntentId: stringifyDocId(doc._id),
        date: doc.date,
        time: doc.time,
        slotsTotal: doc.partySize,
      };
    });
};
