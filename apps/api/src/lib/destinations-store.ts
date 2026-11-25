/** Curated **Destination** rows (Mongo collection `areas`; stable ids `area-seed-*`). */
import type { Collection } from 'mongodb';
import type {
  AreaBoundsRing,
  AreaCenter,
  AreaDTO,
  AreaPublicDTO,
  AreaStatus,
  DestinationPublicDTO,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { newEntityId } from './entity-builders.js';

type MongoDestinationDoc = {
  _id: string;
  slug: string;
  name: string;
  region: string;
  status: AreaStatus;
  center: AreaCenter;
  bounds: AreaBoundsRing;
  priority: number;
  summary?: string | null;
  countryCode?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const collection = (): Collection<MongoDestinationDoc> =>
  getMongoClient()!.db().collection<MongoDestinationDoc>(COLLECTIONS.DESTINATIONS);

const mapDestinationDto = (doc: MongoDestinationDoc): AreaDTO => ({
  id: doc._id,
  slug: doc.slug,
  name: doc.name,
  region: doc.region,
  status: doc.status,
  center: doc.center,
  bounds: doc.bounds,
  priority: doc.priority,
  summary: doc.summary ?? null,
  countryCode: doc.countryCode ?? 'AE',
  imageUrl: doc.imageUrl ?? null,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const toPublicSlice = (row: AreaDTO): AreaPublicDTO => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  region: row.region,
  center: row.center,
  bounds: row.bounds,
  priority: row.priority,
  summary: row.summary ?? null,
  countryCode: row.countryCode ?? 'AE',
  imageUrl: row.imageUrl ?? null,
});

export const toDestinationPublicDto = (row: AreaDTO | AreaPublicDTO): DestinationPublicDTO =>
  'status' in row ? toPublicSlice(row) : row;

export const listPublishedDestinations = async (): Promise<AreaDTO[]> => {
  const docs = await collection()
    .find({ status: 'published' })
    .sort({ priority: 1, name: 1 })
    .toArray();
  return docs.map(mapDestinationDto);
};

export const listAdminDestinations = async (): Promise<AreaDTO[]> => {
  const docs = await collection().find({}).sort({ priority: 1, name: 1 }).toArray();
  return docs.map(mapDestinationDto);
};

export const findDestinationBySlug = async (slug: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ slug });
  return doc ? mapDestinationDto(doc) : null;
};

export const findDestinationById = async (destinationId: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ _id: destinationId });
  return doc ? mapDestinationDto(doc) : null;
};

export const findPublishedDestinationById = async (destinationId: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ _id: destinationId, status: 'published' });
  return doc ? mapDestinationDto(doc) : null;
};

export const findDestinationsByIds = async (destinationIds: string[]): Promise<AreaDTO[]> => {
  const ids = [...new Set(destinationIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];
  const docs = await collection().find({ _id: { $in: ids } }).toArray();
  return docs.map(mapDestinationDto);
};

export type AdminDestinationInput = {
  slug: string;
  name: string;
  region: string;
  status: AreaStatus;
  center: AreaCenter;
  bounds: AreaBoundsRing;
  priority?: number;
  summary?: string | null;
  countryCode?: string | null;
  imageUrl?: string | null;
};

export const createAdminDestination = async (input: AdminDestinationInput): Promise<AreaDTO> => {
  const now = new Date();
  const id = newEntityId();
  const doc: MongoDestinationDoc = {
    _id: id,
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    region: input.region.trim(),
    status: input.status,
    center: input.center,
    bounds: input.bounds,
    priority: input.priority ?? 100,
    summary: input.summary?.trim() || null,
    countryCode: input.countryCode?.trim() || 'AE',
    imageUrl: input.imageUrl?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return mapDestinationDto(doc);
};

export const updateAdminDestination = async (
  destinationId: string,
  patch: Partial<AdminDestinationInput>
): Promise<AreaDTO | null> => {
  const update: Partial<MongoDestinationDoc> = { updatedAt: new Date() };
  if (patch.slug !== undefined) update.slug = patch.slug.trim().toLowerCase();
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.region !== undefined) update.region = patch.region.trim();
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.center !== undefined) update.center = patch.center;
  if (patch.bounds !== undefined) update.bounds = patch.bounds;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.summary !== undefined) update.summary = patch.summary?.trim() || null;
  if (patch.countryCode !== undefined) update.countryCode = patch.countryCode?.trim() || 'AE';
  if (patch.imageUrl !== undefined) update.imageUrl = patch.imageUrl?.trim() || null;

  const result = await collection().findOneAndUpdate(
    { _id: destinationId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result ? mapDestinationDto(result) : null;
};

export const deleteAdminDestination = async (destinationId: string): Promise<boolean> => {
  const result = await collection().deleteOne({ _id: destinationId });
  return result.deletedCount > 0;
};

/** Idempotent upsert for seed + tests. */
export const upsertDestinationBySlug = async (
  input: AdminDestinationInput & { id?: string }
): Promise<AreaDTO> => {
  const slug = input.slug.trim().toLowerCase();
  const existing = await collection().findOne({ slug });
  const now = new Date();
  if (existing) {
    const doc: MongoDestinationDoc = {
      ...existing,
      name: input.name.trim(),
      region: input.region.trim(),
      status: input.status,
      center: input.center,
      bounds: input.bounds,
      priority: input.priority ?? existing.priority,
      summary: input.summary !== undefined ? input.summary?.trim() || null : existing.summary ?? null,
      countryCode:
        input.countryCode !== undefined ? input.countryCode?.trim() || 'AE' : existing.countryCode ?? 'AE',
      imageUrl: input.imageUrl !== undefined ? input.imageUrl?.trim() || null : existing.imageUrl ?? null,
      updatedAt: now,
    };
    await collection().replaceOne({ _id: existing._id }, doc);
    return mapDestinationDto(doc);
  }
  const id = input.id ?? newEntityId();
  const doc: MongoDestinationDoc = {
    _id: id,
    slug,
    name: input.name.trim(),
    region: input.region.trim(),
    status: input.status,
    center: input.center,
    bounds: input.bounds,
    priority: input.priority ?? 100,
    summary: input.summary?.trim() || null,
    countryCode: input.countryCode?.trim() || 'AE',
    imageUrl: input.imageUrl?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return mapDestinationDto(doc);
};

export type { AreaStatus as DestinationStatus };