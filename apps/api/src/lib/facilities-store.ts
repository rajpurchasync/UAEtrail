import type { Collection, Document } from 'mongodb';
import type { FacilityKind } from '@uaetrail/shared-types';
import type { Facility } from '../domain/facility.js';
import { LocationStatus } from '../domain/enums.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { newEntityId } from './entity-builders.js';
import { withCatalogLifecycleFields } from './catalog-lifecycle-map.js';
import { emitGeoPinChange, facilityToCountedPin } from './geo-write.js';
import { resolveGeoRefForPin } from './geo-resolve.js';
import { catalogDestinationIdUpdate } from '@uaetrail/shared-types';
import { catalogOnSiteIdUpdate, resolveStoredOnSiteId } from './facility-on-site-sync.js';

export type MongoFacilityDoc = Omit<Facility, 'id'> & { _id: string };

export const facilitiesCollection = (): Collection<MongoFacilityDoc> =>
  getMongoClient()!.db().collection<MongoFacilityDoc>(COLLECTIONS.FACILITIES);

export const mapMongoFacility = (doc: MongoFacilityDoc): Facility => {
  const { _id, ...rest } = doc;
  const onSiteId = resolveStoredOnSiteId(rest);
  return {
    id: _id,
    ...rest,
    onSiteId,
    partnerReferralUrl: rest.partnerReferralUrl ?? null,
    placeHubLabel: rest.placeHubLabel ?? null,
    registeredByUserId: rest.registeredByUserId ?? rest.submittedById ?? null,
  };
};

export const findFacilityById = async (facilityId: string): Promise<Facility | null> => {
  const doc = await facilitiesCollection().findOne({ _id: facilityId } as Document);
  return doc ? mapMongoFacility(doc) : null;
};

export const findActiveFacilityById = async (facilityId: string): Promise<Facility | null> => {
  const doc = await facilitiesCollection().findOne({
    _id: facilityId,
    status: LocationStatus.ACTIVE,
  } as Document);
  return doc ? mapMongoFacility(doc) : null;
};

/** Active facilities for everyone; draft for submitter or platform admin. */
export const findFacilityForDetailView = async (
  facilityId: string,
  viewerUserId?: string | null,
  viewerRole?: string | null
): Promise<Facility | null> => {
  const active = await findActiveFacilityById(facilityId);
  if (active) return active;

  const doc = await facilitiesCollection().findOne({ _id: facilityId } as Document);
  if (!doc || doc.status !== LocationStatus.DRAFT) return null;

  const isAdmin = viewerRole === 'ADMIN' || viewerRole === 'PLATFORM_ADMIN';
  const submitterId = doc.registeredByUserId ?? doc.submittedById ?? null;
  if (viewerUserId && (submitterId === viewerUserId || isAdmin)) {
    return mapMongoFacility(doc);
  }
  return null;
};

export const listFacilitiesByOnSiteId = async (
  onSiteId: string,
  take = 16
): Promise<Facility[]> => {
  const items = await facilitiesCollection()
    .find({
      onSiteId: onSiteId.trim(),
      status: LocationStatus.ACTIVE,
      publicationStatus: 'listed',
      moderationStatus: 'approved',
    } as Document)
    .sort({ name: 1 })
    .limit(take)
    .toArray();
  return items.map(mapMongoFacility);
};

/** Listed amenities for explore map pins (same filter as public catalog). */
export const listFacilitiesForExploreMap = async (take = 1200): Promise<Facility[]> =>
  listFacilitiesCatalog({ take });

export const listFacilitiesCatalog = async (input: {
  destinationId?: string;
  onSiteId?: string | null;
  facilityKind?: FacilityKind;
  countryCode?: string;
  take?: number;
}): Promise<Facility[]> => {
  const filter: Record<string, unknown> = {
    status: LocationStatus.ACTIVE,
    moderationStatus: 'approved',
    publicationStatus: 'listed',
  };
  if (input.destinationId?.trim()) {
    filter.destinationId = input.destinationId.trim();
  }
  if (input.onSiteId?.trim()) {
    filter.onSiteId = input.onSiteId.trim();
  }
  if (input.facilityKind) filter.facilityKind = input.facilityKind;
  if (input.countryCode?.trim()) filter.countryCode = input.countryCode.trim().toUpperCase();

  const items = await facilitiesCollection()
    .find(filter as Document)
    .sort({ name: 1 })
    .limit(input.take ?? 200)
    .toArray();
  return items.map(mapMongoFacility);
};

export const listFacilitiesPaged = async (input: {
  page: number;
  pageSize: number;
  countryCode?: string;
}): Promise<{ items: Facility[]; total: number }> => {
  const filter: Record<string, unknown> = {
    status: LocationStatus.ACTIVE,
    moderationStatus: 'approved',
    publicationStatus: 'listed',
  };
  if (input.countryCode?.trim()) {
    filter.countryCode = input.countryCode.trim().toUpperCase();
  }
  const collection = facilitiesCollection();
  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await Promise.all([
    collection.find(filter as Document).sort({ name: 1 }).skip(skip).limit(input.pageSize).toArray(),
    collection.countDocuments(filter as Document),
  ]);
  return { items: items.map(mapMongoFacility), total };
};

export type FacilityCreateInput = {
  name: string;
  region: string;
  destinationId: string;
  placeHubLabel?: string | null;
  facilityKind: FacilityKind;
  onSiteId?: string | null;
  description: string;
  latitude: number;
  longitude: number;
  images: string[];
  partnerReferralUrl?: string | null;
  tags?: string[];
  countryCode?: string;
  registeredByUserId: string;
  status?: LocationStatus;
};

export const createFacilityRecord = async (input: FacilityCreateInput): Promise<Facility> => {
  const id = newEntityId();
  const now = new Date();
  const status = input.status ?? LocationStatus.DRAFT;
  const lifecycle = withCatalogLifecycleFields({
    status,
    registryListed: true,
    submittedById: input.registeredByUserId,
    registeredByUserId: input.registeredByUserId,
  });

  const doc: MongoFacilityDoc = {
    _id: id,
    name: input.name,
    region: input.region,
    placeHubLabel: input.placeHubLabel ?? null,
    destinationId: input.destinationId.trim(),
    facilityKind: input.facilityKind,
    ...catalogOnSiteIdUpdate(input.onSiteId),
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    images: input.images,
    partnerReferralUrl: input.partnerReferralUrl?.trim() || null,
    tags: input.tags ?? [],
    featured: false,
    countryCode: (input.countryCode ?? 'AE').toUpperCase(),
    createdAt: now,
    updatedAt: now,
    ...lifecycle,
    registryListed: true,
    status,
    submittedById: input.registeredByUserId,
  };

  await facilitiesCollection().insertOne(doc);
  const mapped = mapMongoFacility(doc);
  if (mapped.latitude != null && mapped.longitude != null) {
    const { geoRef } = await resolveGeoRefForPin({
      latitude: mapped.latitude,
      longitude: mapped.longitude,
      destinationId: mapped.destinationId,
      countryCode: mapped.countryCode,
      region: mapped.region,
      venueName: mapped.name,
    });
    await facilitiesCollection().updateOne(
      { _id: mapped.id },
      { $set: { geoRef, venueId: geoRef.venueId ?? null } }
    );
    mapped.geoRef = geoRef;
    mapped.venueId = geoRef.venueId ?? null;
    await emitGeoPinChange(null, facilityToCountedPin(mapped));
  }
  return mapped;
};

export type AdminFacilityCreateInput = {
  name: string;
  region: string;
  destinationId: string;
  placeHubLabel?: string | null;
  facilityKind: FacilityKind;
  onSiteId?: string | null;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  partnerReferralUrl?: string | null;
  tags?: string[];
  featured?: boolean;
  status?: LocationStatus;
  countryCode?: string;
  createdByUserId: string;
};

/** Platform admin create — `facilities` only (no `locations` dual-write). */
export const createAdminFacility = async (input: AdminFacilityCreateInput): Promise<Facility> => {
  const id = newEntityId();
  const now = new Date();
  const status = input.status ?? LocationStatus.ACTIVE;
  const lifecycle = withCatalogLifecycleFields({
    status,
    registryListed: true,
    submittedById: input.createdByUserId,
    registeredByUserId: input.createdByUserId,
  });

  const doc: MongoFacilityDoc = {
    _id: id,
    name: input.name,
    region: input.region,
    placeHubLabel: input.placeHubLabel ?? null,
    destinationId: input.destinationId.trim(),
    facilityKind: input.facilityKind,
    ...catalogOnSiteIdUpdate(input.onSiteId),
    description: input.description,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    images: input.images,
    partnerReferralUrl: input.partnerReferralUrl?.trim() || null,
    tags: input.tags ?? [],
    featured: input.featured ?? false,
    countryCode: (input.countryCode ?? 'AE').toUpperCase(),
    createdAt: now,
    updatedAt: now,
    ...lifecycle,
    registryListed: true,
    status,
    submittedById: input.createdByUserId,
  };

  await facilitiesCollection().insertOne(doc);
  const mapped = mapMongoFacility(doc);
  if (mapped.latitude != null && mapped.longitude != null) {
    const { geoRef } = await resolveGeoRefForPin({
      latitude: mapped.latitude,
      longitude: mapped.longitude,
      destinationId: mapped.destinationId,
      countryCode: mapped.countryCode,
      region: mapped.region,
      venueName: mapped.name,
    });
    await facilitiesCollection().updateOne(
      { _id: mapped.id },
      { $set: { geoRef, venueId: geoRef.venueId ?? null } }
    );
    mapped.geoRef = geoRef;
    mapped.venueId = geoRef.venueId ?? null;
    await emitGeoPinChange(null, facilityToCountedPin(mapped));
  }
  return mapped;
};

export const listAdminFacilitiesPaged = async (input: { skip: number; take: number }) => {
  const collection = facilitiesCollection();
  const [items, total] = await Promise.all([
    collection.find({}).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    collection.countDocuments({}),
  ]);
  return { items: items.map(mapMongoFacility), total };
};

export type AdminFacilityUpdateInput = Partial<
  Pick<
    Facility,
    | 'name'
    | 'region'
    | 'placeHubLabel'
    | 'destinationId'
    | 'facilityKind'
    | 'onSiteId'
    | 'description'
    | 'latitude'
    | 'longitude'
    | 'images'
    | 'partnerReferralUrl'
    | 'tags'
    | 'status'
    | 'featured'
    | 'countryCode'
    | 'moderationStatus'
    | 'publicationStatus'
  >
>;

export const updateAdminFacility = async (
  id: string,
  data: AdminFacilityUpdateInput
): Promise<Facility | null> => {
  const existing = await findFacilityById(id);
  if (!existing) return null;

  const updatedAt = new Date();
  const patch = { ...data, updatedAt };
  await facilitiesCollection().updateOne({ _id: id } as Document, { $set: patch });
  return findFacilityById(id);
};

export const deleteAdminFacility = async (id: string): Promise<boolean> => {
  const result = await facilitiesCollection().deleteOne({ _id: id } as Document);
  return result.deletedCount > 0;
};
