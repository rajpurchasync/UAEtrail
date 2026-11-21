import type { Collection } from 'mongodb';
import { DETAIL_ARRAY_CAPS, type CatalogEntryDoc } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

const col = (): Collection<CatalogEntryDoc> =>
  getMongoClient()!.db().collection<CatalogEntryDoc>(COLLECTIONS.CATALOGS);

/** Dev / migration seed only — production must run `mongo-migrations` (see `seedCatalogsIfEmpty`). */
const DEFAULTS: CatalogEntryDoc[] = [
  { _id: 'gear-water', kind: 'gear', key: 'water', labelEn: 'Water' },
  { _id: 'gear-headlamp', kind: 'gear', key: 'headlamp', labelEn: 'Headlamp' },
  { _id: 'amenity-toilet', kind: 'amenity', key: 'toilet', labelEn: 'Toilet' },
  { _id: 'hazard-heat', kind: 'hazard', key: 'heat', labelEn: 'Extreme heat' },
  {
    _id: 'policy-flexible',
    kind: 'cancellation_policy',
    key: 'flexible',
    labelEn: 'Flexible',
    freeCancelHours: 24,
    refundPctAfter: 0,
    hostCancelText: 'The host handles refunds outside the app.',
  },
];

let memory: CatalogEntryDoc[] | null = null;

const allowRuntimeCatalogSeed = (): boolean =>
  process.env.NODE_ENV !== 'production' || process.env.CATALOGS_ALLOW_RUNTIME_SEED?.trim() === '1';

/** Idempotent migration helper — not invoked on ordinary catalog reads in production. */
export const seedCatalogsIfEmpty = async (): Promise<void> => {
  const count = await col().countDocuments();
  if (count > 0) {
    memory = await col().find({}).toArray();
    return;
  }
  if (!allowRuntimeCatalogSeed()) {
    memory = [];
    return;
  }
  await col().insertMany(DEFAULTS, { ordered: false }).catch(() => undefined);
  memory = await col().find({}).toArray();
};

export const listCatalogs = async (): Promise<CatalogEntryDoc[]> => {
  if (memory) return memory;
  const docs = await col().find({}).toArray();
  if (docs.length > 0) {
    memory = docs;
    return docs;
  }
  if (allowRuntimeCatalogSeed()) {
    await seedCatalogsIfEmpty();
    return memory ?? [];
  }
  return [];
};

export const assertDetailArrayCaps = (input: {
  gear?: unknown[];
  itinerary?: unknown[];
  images?: unknown[];
  requirements?: unknown[];
}): void => {
  if ((input.gear?.length ?? 0) > DETAIL_ARRAY_CAPS.gear) {
    throw new Error('gear list exceeds cap');
  }
  if ((input.itinerary?.length ?? 0) > DETAIL_ARRAY_CAPS.itinerary) {
    throw new Error('itinerary exceeds cap');
  }
  if ((input.images?.length ?? 0) > DETAIL_ARRAY_CAPS.galleryActivity) {
    throw new Error('images exceed cap');
  }
  if ((input.requirements?.length ?? 0) > DETAIL_ARRAY_CAPS.includesExcludes) {
    throw new Error('requirements exceed cap');
  }
};