import type { ExploreMapItemDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { ObjectId } from 'mongodb';
import type { CreateParticipantIntentInput, ParticipantIntentKind } from '../domain/participant-intent.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users.js';
import { getMongoClient } from './mongo.js';

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

const demandFallbackTitle = (kind: ParticipantIntentKind): string => {
  switch (kind) {
    case 'hiking':
      return 'Looking for hiking buddies';
    case 'camping':
      return 'Looking for camping plans';
    case 'event':
      return 'Looking for an event';
    case 'guide':
      return 'Looking for a guide';
    case 'carpool':
      return 'Ride share request';
    case 'other':
      return 'Outdoor plan request';
    default:
      return 'Community request';
  }
};

/** Strip legacy auto-titles that incorrectly embed the requester name in the title string. */
const normalizeLegacyDemandTitle = (title: string, kind: ParticipantIntentKind): string => {
  const trimmed = title.trim();
  if (!trimmed) return demandFallbackTitle(kind);

  const legacyPatterns: RegExp[] = [
    /^.+ needs a carpool$/i,
    /^.+ wants to go hiking$/i,
    /^.+ wants to go camping$/i,
    /^.+ is looking for an event$/i,
    /^.+ is looking for a guide$/i,
    /^.+ posted a plan$/i,
    /^.+ wants to go$/i,
  ];

  if (legacyPatterns.some((pattern) => pattern.test(trimmed))) {
    return demandFallbackTitle(kind);
  }

  return trimmed;
};

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

const demandTitle = (kind: ParticipantIntentKind, displayName: string): string => {
  void displayName;
  return demandFallbackTitle(kind);
};

const mapDto = (
  doc: MongoParticipantIntent,
  user?: { profile?: { displayName?: string | null; avatarUrl?: string | null } } | null
): ParticipantIntentDTO => ({
  id: stringifyDocId(doc._id),
  userId: doc.userId,
  kind: doc.kind,
  title: doc.title?.trim()
    ? normalizeLegacyDemandTitle(doc.title.trim(), doc.kind)
    : demandTitle(doc.kind, user?.profile?.displayName ?? 'Someone'),
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
  const user = await findAuthUserById(userId);
  return mapDto(doc, user);
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

  return docs
    .filter((doc) => doc.latitude != null && doc.longitude != null)
    .map((doc) => {
      const user = userMap.get(doc.userId);
      const displayName = user?.profile?.displayName ?? 'Someone';
      const route = buildDemandRouteLabels(doc);
      const planTitle = doc.title?.trim()
        ? normalizeLegacyDemandTitle(doc.title.trim(), doc.kind)
        : demandTitle(doc.kind, displayName);
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
        path: `/`,
        hostName: displayName,
        hostAvatar: user?.profile?.avatarUrl ?? null,
        requesterUserId: doc.userId,
        date: doc.date,
        time: doc.time,
        slotsTotal: doc.partySize,
      };
    });
};
