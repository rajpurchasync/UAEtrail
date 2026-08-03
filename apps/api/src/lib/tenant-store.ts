import type { Collection } from 'mongodb';
import { TenantStatus, type TenantType } from '../domain/enums.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { slugify } from './slug.js';

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  ownerId: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
};

type MongoTenantDoc = {
  _id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  ownerId: string;
  countryCode: string;
  createdAt: Date;
  updatedAt: Date;
};

const tenantsCollection = (): Collection<MongoTenantDoc> =>
  getMongoClient()!.db().collection<MongoTenantDoc>('tenants');

const mapMongoTenant = (doc: MongoTenantDoc): TenantRecord => ({
  id: doc._id,
  name: doc.name,
  slug: doc.slug,
  type: doc.type,
  status: doc.status,
  ownerId: doc.ownerId,
  countryCode: doc.countryCode,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const tenantRowToMongoDoc = (row: TenantRecord): MongoTenantDoc => ({
  _id: row.id,
  name: row.name,
  slug: row.slug,
  type: row.type,
  status: row.status,
  ownerId: row.ownerId,
  countryCode: row.countryCode,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

export const writeTenantToMongo = async (row: TenantRecord): Promise<void> => {
  await tenantsCollection().updateOne(
    { _id: row.id },
    { $set: tenantRowToMongoDoc(row) },
    { upsert: true }
  );
};

export const syncTenantById = async (_id: string): Promise<void> => {
  // Mongo is the source of truth; no sync needed.
};

export const isTenantSlugTaken = async (slug: string): Promise<boolean> => {
  const existing = await tenantsCollection().findOne({ slug }, { projection: { _id: 1 } });
  return Boolean(existing);
};

export const ensureUniqueTenantSlug = async (baseSlug: string): Promise<string> => {
  let candidate = slugify(baseSlug);
  let attempt = 1;
  while (await isTenantSlugTaken(candidate)) {
    candidate = `${slugify(baseSlug)}-${attempt}`;
    attempt += 1;
  }
  return candidate;
};

export const findTenantById = async (tenantId: string): Promise<TenantRecord | null> => {
  const doc = await tenantsCollection().findOne({ _id: tenantId });
  return doc ? mapMongoTenant(doc) : null;
};

export const findTenantByOwnerId = async (ownerId: string): Promise<TenantRecord | null> => {
  const doc = await tenantsCollection().findOne({ ownerId });
  return doc ? mapMongoTenant(doc) : null;
};

export const findTenantBySlug = async (slug: string): Promise<TenantRecord | null> => {
  const doc = await tenantsCollection().findOne({ slug });
  return doc ? mapMongoTenant(doc) : null;
};

export const findTenantCountryCode = async (
  tenantId: string
): Promise<{ countryCode: string } | null> => {
  const tenant = await findTenantById(tenantId);
  return tenant ? { countryCode: tenant.countryCode } : null;
};

export const createTenantRecord = async (input: {
  id?: string;
  name: string;
  slug: string;
  type: TenantType;
  status?: TenantStatus;
  ownerId: string;
  countryCode?: string;
}): Promise<TenantRecord> => {
  const tenantId = input.id ?? newEntityId();
  const now = new Date();
  const tenant: TenantRecord = {
    id: tenantId,
    name: input.name,
    slug: input.slug,
    type: input.type,
    status: input.status ?? TenantStatus.PENDING,
    ownerId: input.ownerId,
    countryCode: input.countryCode ?? 'AE',
    createdAt: now,
    updatedAt: now
  };

  await writeTenantToMongo(tenant);
  return tenant;
};

export const findTenantStatus = async (tenantId: string): Promise<TenantStatus | null> => {
  const tenant = await findTenantById(tenantId);
  return tenant?.status ?? null;
};
