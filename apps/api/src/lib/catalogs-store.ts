import type { Collection } from 'mongodb';
import { DETAIL_ARRAY_CAPS, type CatalogEntryDoc } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

const col = (): Collection<CatalogEntryDoc> =>
  getMongoClient()!.db().collection<CatalogEntryDoc>(COLLECTIONS.CATALOGS);

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

export const seedCatalogsIfEmpty = async (): Promise<void> => {
  const count = await col().countDocuments();
  if (count > 0) {
    memory = await col().find({}).toArray();
    return;
  }
  await col().insertMany(DEFAULTS, { ordered: false }).catch(() => undefined);
  memory = DEFAULTS;
};

export const listCatalogs = async (): Promise<CatalogEntryDoc[]> => {
  if (memory) return memory;
  await seedCatalogsIfEmpty();
  return memory ?? [];
};

export const assertDetailArrayCaps = (input: {
  gear?: unknown[];
  itinerary?: unknown[];
  gallery?: unknown[];
  goingPreview?: unknown[];
}): void => {
  if ((input.gear?.length ?? 0) > DETAIL_ARRAY_CAPS.gear) {
    throw new Error(`gear exceeds cap ${DETAIL_ARRAY_CAPS.gear}`);
  }
  if ((input.itinerary?.length ?? 0) > DETAIL_ARRAY_CAPS.itinerary) {
    throw new Error(`itinerary exceeds cap ${DETAIL_ARRAY_CAPS.itinerary}`);
  }
  if ((input.gallery?.length ?? 0) > DETAIL_ARRAY_CAPS.galleryActivity) {
    throw new Error(`gallery exceeds cap ${DETAIL_ARRAY_CAPS.galleryActivity}`);
  }
  if ((input.goingPreview?.length ?? 0) > DETAIL_ARRAY_CAPS.goingPreview) {
    throw new Error(`goingPreview exceeds cap ${DETAIL_ARRAY_CAPS.goingPreview}`);
  }
};
