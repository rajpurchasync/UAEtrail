import { randomUUID } from 'node:crypto';
import type { Collection, Document } from 'mongodb';
import type {
  AdminPlatformAlertDTO,
  PlatformAlertScope,
  PlatformAlertSeverity,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

export type MongoPlatformAlertDoc = {
  _id: string;
  active: boolean;
  severity: PlatformAlertSeverity;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  scope: PlatformAlertScope;
  /** Normalized coarse region label (e.g. emirate) when `scope` is `region`. */
  region?: string | null;
  /** Geo point when `scope` is `point` — GeoJSON for 2dsphere index. */
  geo?: { type: 'Point'; coordinates: [number, number] } | null;
  /** Match radius in meters for `point` scope. Default applied in read layer when absent. */
  radiusMeters?: number | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const collection = (): Collection<MongoPlatformAlertDoc> =>
  getMongoClient()!.db().collection<MongoPlatformAlertDoc>(COLLECTIONS.PLATFORM_ALERTS);

/** List rows that are active and within their time window (scope filtering in service layer). */
export const listPlatformAlertsInTimeWindow = async (now: Date): Promise<MongoPlatformAlertDoc[]> =>
  collection()
    .find({
      active: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    } as Document)
    .sort({ startsAt: -1 })
    .limit(48)
    .toArray();

const toAdminDto = (row: MongoPlatformAlertDoc): AdminPlatformAlertDTO => ({
  id: row._id,
  active: row.active,
  severity: row.severity,
  title: row.title,
  body: row.body,
  linkUrl: row.linkUrl ?? null,
  linkLabel: row.linkLabel ?? null,
  scope: row.scope,
  region: row.region ?? null,
  lat: row.geo?.coordinates[1] ?? null,
  lng: row.geo?.coordinates[0] ?? null,
  startsAt: row.startsAt.toISOString(),
  endsAt: row.endsAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

type AlertWriteInput = {
  title: string;
  body: string;
  severity: PlatformAlertSeverity;
  scope: PlatformAlertScope;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
  startsAt: string;
  endsAt: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  active?: boolean;
};

const applyWrite = (input: AlertWriteInput, now: Date): Omit<MongoPlatformAlertDoc, '_id' | 'createdAt'> => ({
  active: input.active ?? true,
  severity: input.severity,
  title: input.title,
  body: input.body,
  linkUrl: input.linkUrl ?? null,
  linkLabel: input.linkLabel ?? null,
  scope: input.scope,
  region: input.scope === 'region' ? input.region ?? null : null,
  geo:
    input.scope === 'point' && input.lat != null && input.lng != null
      ? { type: 'Point', coordinates: [input.lng, input.lat] }
      : null,
  radiusMeters: input.scope === 'point' ? 25000 : null,
  startsAt: new Date(input.startsAt),
  endsAt: new Date(input.endsAt),
  updatedAt: now,
});

export const listPlatformAlertsAdmin = async (): Promise<AdminPlatformAlertDTO[]> => {
  const rows = await collection().find({}).sort({ updatedAt: -1 }).limit(200).toArray();
  return rows.map(toAdminDto);
};

export const createPlatformAlert = async (input: AlertWriteInput): Promise<AdminPlatformAlertDTO> => {
  const now = new Date();
  const doc: MongoPlatformAlertDoc = {
    _id: randomUUID(),
    createdAt: now,
    ...applyWrite(input, now),
  };
  await collection().insertOne(doc);
  return toAdminDto(doc);
};

export const updatePlatformAlert = async (
  id: string,
  patch: Partial<AlertWriteInput>
): Promise<AdminPlatformAlertDTO | null> => {
  const existing = await collection().findOne({ _id: id });
  if (!existing) return null;
  const merged: AlertWriteInput = {
    title: patch.title ?? existing.title,
    body: patch.body ?? existing.body,
    severity: patch.severity ?? existing.severity,
    scope: patch.scope ?? existing.scope,
    region: patch.region !== undefined ? patch.region : existing.region,
    lat: patch.lat !== undefined ? patch.lat : existing.geo?.coordinates[1],
    lng: patch.lng !== undefined ? patch.lng : existing.geo?.coordinates[0],
    startsAt: patch.startsAt ?? existing.startsAt.toISOString(),
    endsAt: patch.endsAt ?? existing.endsAt.toISOString(),
    linkUrl: patch.linkUrl !== undefined ? patch.linkUrl : existing.linkUrl,
    linkLabel: patch.linkLabel !== undefined ? patch.linkLabel : existing.linkLabel,
    active: patch.active ?? existing.active,
  };
  const now = new Date();
  const next = applyWrite(merged, now);
  await collection().updateOne({ _id: id }, { $set: next });
  const row = await collection().findOne({ _id: id });
  return row ? toAdminDto(row) : null;
};

export const expirePlatformAlert = async (id: string): Promise<AdminPlatformAlertDTO | null> => {
  const now = new Date();
  await collection().updateOne(
    { _id: id },
    { $set: { active: false, endsAt: now, updatedAt: now } }
  );
  const row = await collection().findOne({ _id: id });
  return row ? toAdminDto(row) : null;
};
