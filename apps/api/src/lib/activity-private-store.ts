/**
 * Private activity payload (plan §13.4) — exact meeting pin and emergency contact.
 * `_id` matches `activities._id`. Public shell reads from `activities`; crew surfaces read merged fields.
 */
import type { Collection } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

export type GeoPointDoc = { type: 'Point'; coordinates: [lng: number, lat: number] };

export type MongoActivityPrivateDoc = {
  _id: string;
  /** Present when the host set a meeting pin; crew DTOs merge exact coords from here. */
  exactGeo?: GeoPointDoc;
  meetingNotes?: string | null;
  emergencyContact?: { name: string; phone: string } | null;
  plateNumber?: string | null;
  chatId?: string | null;
  updatedAt: Date;
};

const collection = (): Collection<MongoActivityPrivateDoc> =>
  getMongoClient()!.db().collection<MongoActivityPrivateDoc>(COLLECTIONS.ACTIVITY_PRIVATE);

const isValidMeetingPair = (lat: number | null | undefined, lng: number | null | undefined): boolean =>
  lat != null &&
  lng != null &&
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  !Number.isNaN(lat) &&
  !Number.isNaN(lng);

const isPrivateDocEmpty = (row: MongoActivityPrivateDoc | null): boolean => {
  if (!row) return true;
  const hasGeo = Boolean(row.exactGeo?.coordinates?.length === 2);
  const hasNotes = Boolean(row.meetingNotes?.trim());
  const hasEmergency =
    Boolean(row.emergencyContact?.name?.trim()) && Boolean(row.emergencyContact?.phone?.trim());
  const hasPlate = Boolean(row.plateNumber?.trim());
  const hasChat = Boolean(row.chatId?.trim());
  return !hasGeo && !hasNotes && !hasEmergency && !hasPlate && !hasChat;
};

export const pruneActivityPrivateIfEmpty = async (activityId: string): Promise<void> => {
  const row = await collection().findOne({ _id: activityId });
  if (row && isPrivateDocEmpty(row)) {
    await collection().deleteOne({ _id: activityId });
  }
};

/** Partial crew-only fields — omit a key to leave the existing DB value unchanged (PATCH). */
export type ActivityPrivateCrewFieldsPatch = {
  emergencyContact?: { name: string; phone: string } | null;
  plateNumber?: string | null;
};

export const mergeActivityPrivateCrewFields = async (
  input: { activityId: string } & ActivityPrivateCrewFieldsPatch
): Promise<void> => {
  const $set: Record<string, unknown> = { updatedAt: new Date() };

  if ('emergencyContact' in input) {
    const emergency = input.emergencyContact;
    if (emergency === null) {
      $set.emergencyContact = null;
    } else if (emergency) {
      $set.emergencyContact = {
        name: emergency.name.trim(),
        phone: emergency.phone.trim(),
      };
    }
  }

  if ('plateNumber' in input) {
    const p = input.plateNumber;
    $set.plateNumber =
      typeof p === 'string' && p.trim().length > 0 ? p.trim() : null;
  }

  const keysBeyondUpdatedAt = Object.keys($set).filter((k) => k !== 'updatedAt');
  if (keysBeyondUpdatedAt.length === 0) {
    return;
  }

  const existing = await collection().findOne({ _id: input.activityId });
  await collection().updateOne(
    { _id: input.activityId },
    { $set },
    { upsert: !existing }
  );
  await pruneActivityPrivateIfEmpty(input.activityId);
};

export const upsertActivityPrivateFromMeetingFields = async (input: {
  activityId: string;
  meetingLat: number | null;
  meetingLng: number | null;
  meetingNotes?: string | null;
}): Promise<void> => {
  const now = new Date();
  const notesTrimmed = input.meetingNotes?.trim();
  const notes = notesTrimmed ? notesTrimmed : null;

  if (!isValidMeetingPair(input.meetingLat, input.meetingLng)) {
    const existing = await collection().findOne({ _id: input.activityId });
    if (!existing && notes == null) {
      return;
    }

    const unsetFields: { exactGeo?: '' | 1 | true; meetingNotes?: '' | 1 | true } = {};
    if (existing?.exactGeo) {
      unsetFields.exactGeo = '';
    }
    if (notes == null && existing?.meetingNotes) {
      unsetFields.meetingNotes = '';
    }

    await collection().updateOne(
      { _id: input.activityId },
      {
        ...(Object.keys(unsetFields).length > 0 ? { $unset: unsetFields } : {}),
        $set: {
          ...(notes != null ? { meetingNotes: notes } : {}),
          updatedAt: now,
        },
      },
      { upsert: !existing && notes != null }
    );
    await pruneActivityPrivateIfEmpty(input.activityId);
    return;
  }

  await collection().updateOne(
    { _id: input.activityId },
    {
      $set: {
        exactGeo: { type: 'Point', coordinates: [input.meetingLng!, input.meetingLat!] },
        meetingNotes: notes,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
};

export const findActivityPrivateById = async (activityId: string): Promise<MongoActivityPrivateDoc | null> =>
  collection().findOne({ _id: activityId });

export const findActivityPrivateByIds = async (
  activityIds: string[]
): Promise<Map<string, MongoActivityPrivateDoc>> => {
  const unique = [...new Set(activityIds.filter(Boolean))];
  const map = new Map<string, MongoActivityPrivateDoc>();
  if (unique.length === 0) return map;
  const docs = await collection()
    .find({ _id: { $in: unique } })
    .toArray();
  for (const doc of docs) {
    map.set(doc._id, doc);
  }
  return map;
};
