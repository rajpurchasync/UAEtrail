import type { Collection } from 'mongodb';
import type { AreaBoundsRing, AreaCenter, AreaDTO, AreaPublicDTO, AreaStatus } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { newEntityId } from './entity-builders.js';

type MongoAreaDoc = {
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

const collection = (): Collection<MongoAreaDoc> =>
  getMongoClient()!.db().collection<MongoAreaDoc>(COLLECTIONS.AREAS);

const mapAreaDto = (doc: MongoAreaDoc): AreaDTO => ({
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

export const toAreaPublicDto = (area: AreaDTO): AreaPublicDTO => ({
  id: area.id,
  slug: area.slug,
  name: area.name,
  region: area.region,
  center: area.center,
  bounds: area.bounds,
  summary: area.summary ?? null,
  countryCode: area.countryCode ?? 'AE',
  imageUrl: area.imageUrl ?? null,
});

export const listPublishedAreas = async (): Promise<AreaDTO[]> => {
  const docs = await collection()
    .find({ status: 'published' })
    .sort({ priority: 1, name: 1 })
    .toArray();
  return docs.map(mapAreaDto);
};

export const listAdminAreas = async (): Promise<AreaDTO[]> => {
  const docs = await collection().find({}).sort({ priority: 1, name: 1 }).toArray();
  return docs.map(mapAreaDto);
};

export const findAreaBySlug = async (slug: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ slug });
  return doc ? mapAreaDto(doc) : null;
};

export const findAreaById = async (areaId: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ _id: areaId });
  return doc ? mapAreaDto(doc) : null;
};

export const findPublishedAreaById = async (areaId: string): Promise<AreaDTO | null> => {
  const doc = await collection().findOne({ _id: areaId, status: 'published' });
  return doc ? mapAreaDto(doc) : null;
};

export type AdminAreaInput = {
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

export const createAdminArea = async (input: AdminAreaInput): Promise<AreaDTO> => {
  const now = new Date();
  const id = newEntityId();
  const doc: MongoAreaDoc = {
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
  return mapAreaDto(doc);
};

export const updateAdminArea = async (
  areaId: string,
  patch: Partial<AdminAreaInput>
): Promise<AreaDTO | null> => {
  const update: Partial<MongoAreaDoc> = { updatedAt: new Date() };
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
    { _id: areaId },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result ? mapAreaDto(result) : null;
};

export const deleteAdminArea = async (areaId: string): Promise<boolean> => {
  const result = await collection().deleteOne({ _id: areaId });
  return result.deletedCount > 0;
};

/** Idempotent upsert for seed + tests. */
export const upsertAreaBySlug = async (input: AdminAreaInput & { id?: string }): Promise<AreaDTO> => {
  const slug = input.slug.trim().toLowerCase();
  const existing = await collection().findOne({ slug });
  const now = new Date();
  if (existing) {
    const doc: MongoAreaDoc = {
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
    return mapAreaDto(doc);
  }
  const id = input.id ?? newEntityId();
  const doc: MongoAreaDoc = {
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
  return mapAreaDto(doc);
};
