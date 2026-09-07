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

const mapExploreKind = (kind: ParticipantIntentKind): ExploreMapItemDTO['kind'] => {
  if (kind === 'guide' || kind === 'other') return 'event';
  return kind;
};

const demandTitle = (kind: ParticipantIntentKind, displayName: string): string => {
  const first = displayName.split(/\s+/)[0] || 'Someone';
  switch (kind) {
    case 'hiking':
      return `${first} wants to go hiking`;
    case 'camping':
      return `${first} wants to go camping`;
    case 'event':
      return `${first} is looking for an event`;
    case 'guide':
      return `${first} is looking for a guide`;
    case 'carpool':
      return `${first} needs a carpool`;
    case 'other':
      return `${first} posted a plan`;
    default:
      return `${first} wants to go`;
  }
};

const mapDto = (
  doc: MongoParticipantIntent,
  user?: { profile?: { displayName?: string | null; avatarUrl?: string | null } } | null
): ParticipantIntentDTO => ({
  id: doc._id.toHexString(),
  userId: doc.userId,
  kind: doc.kind,
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
      return {
        id: `demand:${doc._id.toHexString()}`,
        kind: mapExploreKind(doc.kind),
        source: 'demand' as const,
        title: demandTitle(doc.kind, displayName),
        subtitle: doc.preferredArea || doc.comment.slice(0, 80),
        latitude: doc.latitude,
        longitude: doc.longitude,
        toLatitude: doc.toLatitude,
        toLongitude: doc.toLongitude,
        path: `/community?demand=${doc._id.toHexString()}`,
        hostName: displayName,
        hostAvatar: user?.profile?.avatarUrl ?? null,
        date: doc.date,
        time: doc.time,
        slotsTotal: doc.partySize,
      };
    });
};
