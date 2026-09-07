import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { ActivityStatus, ActivityType, LocationStatus } from '../domain/enums.js';
import {
  buildActivityFromCreateInput,
  buildLocationFromCreateInput,
  newEntityId,
  type ActivityCreateInput,
  type ActivityUpdateInput,
  type MongoActivityDoc
} from './entity-builders.js';
import {
  findPublishedActivityWithPreviewsFromMongo,
  findPublicTenantProfileBySlugFromMongo,
  findTenantActivityDocFromMongo,
  findTenantActivityFromMongo,
  listActivitiesByIdsFromMongo,
  listFeaturedPublishedActivitiesFromMongo,
  listPublishedActivitiesWithPreviewsFromMongo,
  listPublishedActivitiesForExploreMapFromMongo,
  listPublishedUpcomingActivitiesByLocationFromMongo,
  listTenantActivitiesFromMongo,
  type ActivityWithTenantRelations
} from './activity-read-assembler.js';
import {
  findActivityDocInMongo,
  findLocationInMongo,
  mapMongoActivityToPublishResult,
  patchActivityInMongo,
  deleteActivityDocInMongo,
  writeActivityDocToMongo,
  writeLocationToMongo
} from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import {
  findTenantById,
  findTenantByOwnerId,
  findTenantCountryCode
} from './tenant-store.js';
import {
  findTenantMembershipByUser,
  listActiveTenantMembershipsByUser
} from './tenant-access.js';

export { findTenantById, findTenantByOwnerId, findTenantCountryCode };
export { findTenantMembershipByUser, listActiveTenantMembershipsByUser };

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
};

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const mapMongoLocation = (doc: MongoLocationDoc): Location => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

export const findLocationById = async (locationId: string) => findLocationInMongo(locationId);

export const listTenantActivitiesDetailed = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  orderBy?: { startAt?: 'asc' | 'desc' };
  whereExtra?: { status?: ActivityStatus };
}) => {
  const sortDirection = input.orderBy?.startAt === 'desc' ? -1 : 1;
  return listTenantActivitiesFromMongo({
    tenantId: input.tenantId,
    skip: input.skip,
    take: input.take,
    sortDirection,
    status: input.whereExtra?.status
  });
};

export const createActivityDetailed = async (data: ActivityCreateInput): Promise<ActivityWithTenantRelations> => {
  const activityId = newEntityId();
  const mongoDoc = buildActivityFromCreateInput(data, activityId);
  await writeActivityDocToMongo(mongoDoc);

  const created = await findTenantActivityFromMongo(activityId, mongoDoc.tenantId);
  if (!created) {
    throw new Error('Failed to persist event record.');
  }
  return created;
};

export const findTenantActivityForEdit = async (activityId: string, tenantId: string) =>
  findTenantActivityFromMongo(activityId, tenantId);

export const updateActivityDetailed = async (
  activityId: string,
  data: ActivityUpdateInput
): Promise<ActivityWithTenantRelations> => {
  const patch: Partial<MongoActivityDoc> = { updatedAt: new Date() };
  if (data.activityType !== undefined) patch.activityType = data.activityType as ActivityType;
  if (data.title !== undefined) patch.title = data.title;
  if (data.startAt !== undefined) patch.startAt = data.startAt;
  if (data.endAt !== undefined) patch.endAt = data.endAt;
  if (data.status !== undefined) patch.status = data.status as ActivityStatus;
  if (data.capacity !== undefined) patch.capacity = data.capacity;
  if (data.priceAed !== undefined) patch.priceAed = data.priceAed;
  if (data.featured !== undefined) patch.featured = data.featured;
  if (data.description !== undefined) patch.description = data.description;
  if (data.meetingPoint !== undefined) patch.meetingPoint = data.meetingPoint;
  if (data.meetingLat !== undefined) patch.meetingLat = data.meetingLat;
  if (data.meetingLng !== undefined) patch.meetingLng = data.meetingLng;
  if (data.startPoint !== undefined) patch.startPoint = data.startPoint;
  if (data.startLat !== undefined) patch.startLat = data.startLat;
  if (data.startLng !== undefined) patch.startLng = data.startLng;
  if (data.parkingPoint !== undefined) patch.parkingPoint = data.parkingPoint;
  if (data.parkingLat !== undefined) patch.parkingLat = data.parkingLat;
  if (data.parkingLng !== undefined) patch.parkingLng = data.parkingLng;
  if (data.meetingDifferent !== undefined) patch.meetingDifferent = data.meetingDifferent;
  if (data.carPoolEnabled !== undefined) patch.carPoolEnabled = data.carPoolEnabled;
  if (data.carPoolFree !== undefined) patch.carPoolFree = data.carPoolFree;
  if (data.carPoolPriceAed !== undefined) patch.carPoolPriceAed = data.carPoolPriceAed;
  if (data.carPoolSeats !== undefined) patch.carPoolSeats = data.carPoolSeats;
  if (data.carPoolDetails !== undefined) patch.carPoolDetails = data.carPoolDetails;
  if (data.paymentTerms !== undefined) patch.paymentTerms = data.paymentTerms;
  if (data.pricingMode !== undefined) patch.pricingMode = data.pricingMode;
  if (data.itinerary !== undefined) patch.itinerary = data.itinerary;
  if (data.requirements !== undefined) patch.requirements = data.requirements;
  if (data.images !== undefined) patch.images = data.images;
  if (data.bannerUrl !== undefined) patch.bannerUrl = data.bannerUrl?.trim() || null;
  if (data.signupUrl !== undefined) patch.signupUrl = data.signupUrl?.trim() || null;
  if (data.pricePackages !== undefined) patch.pricePackages = data.pricePackages;
  if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;
  if (data.host !== undefined) {
    patch.hostId =
      'disconnect' in data.host && data.host.disconnect ? null : data.host.connect?.id ?? null;
  }
  if (data.location?.connect?.id !== undefined) patch.locationId = data.location.connect.id;

  await patchActivityInMongo(activityId, patch);

  const existing = await findActivityDocInMongo(activityId);
  if (!existing) {
    throw new Error('Failed to update event record.');
  }

  const updated = await findTenantActivityFromMongo(activityId, existing.tenantId);
  if (!updated) {
    throw new Error('Failed to update event record.');
  }
  return updated;
};

export const findTenantActivityWithParticipants = async (activityId: string, tenantId: string) =>
  findTenantActivityFromMongo(activityId, tenantId);

export const findTenantActivityById = async (activityId: string, tenantId: string) =>
  findTenantActivityFromMongo(activityId, tenantId);

export const findTenantActivityBasic = async (activityId: string, tenantId: string) => {
  const doc = await findTenantActivityDocFromMongo(activityId, tenantId);
  if (!doc) return null;
  return { id: doc._id, title: doc.title, capacity: doc.capacity };
};

export const cancelActivityById = async (activityId: string) => {
  await patchActivityInMongo(activityId, { status: ActivityStatus.CANCELLED });
  const mongoDoc = await findActivityDocInMongo(activityId);
  if (!mongoDoc) {
    throw new Error('Failed to cancel event.');
  }
  return mapMongoActivityToPublishResult({ ...mongoDoc, status: ActivityStatus.CANCELLED });
};

export const deleteDraftActivityById = async (activityId: string, tenantId: string) => {
  const doc = await findActivityDocInMongo(activityId);
  if (!doc || doc.tenantId !== tenantId) {
    return false;
  }
  if (doc.status !== ActivityStatus.DRAFT) {
    return false;
  }
  return deleteActivityDocInMongo(activityId);
};

export const duplicateTenantActivity = async (
  activityId: string,
  tenantId: string,
  createdById: string
): Promise<ActivityWithTenantRelations> => {
  const source = await findTenantActivityFromMongo(activityId, tenantId);
  if (!source) {
    throw new Error('Activity not found.');
  }

  const copyTitle = `${source.title} (Copy)`.slice(0, 120);
  const hostId = source.hostId ?? source.createdById ?? createdById;

  const created = await createActivityDetailed({
    tenant: { connect: { id: tenantId } },
    location: { connect: { id: source.locationId } },
    createdBy: { connect: { id: createdById } },
    host: { connect: { id: hostId } },
    title: copyTitle,
    description: source.description,
    startAt: source.startAt,
    endAt: source.endAt ?? undefined,
    meetingPoint: source.meetingPoint ?? undefined,
    meetingLat: source.meetingLat ?? undefined,
    meetingLng: source.meetingLng ?? undefined,
    startPoint: source.startPoint ?? undefined,
    startLat: source.startLat ?? undefined,
    startLng: source.startLng ?? undefined,
    parkingPoint: source.parkingPoint ?? undefined,
    parkingLat: source.parkingLat ?? undefined,
    parkingLng: source.parkingLng ?? undefined,
    meetingDifferent: source.meetingDifferent ?? false,
    carPoolEnabled: source.carPoolEnabled ?? false,
    carPoolFree: source.carPoolEnabled ? (source.carPoolFree ?? true) : null,
    carPoolPriceAed:
      source.carPoolEnabled && source.carPoolFree === false ? source.carPoolPriceAed ?? 0 : null,
    carPoolSeats: source.carPoolEnabled ? source.carPoolSeats ?? null : null,
    carPoolDetails: source.carPoolEnabled ? source.carPoolDetails ?? undefined : undefined,
    paymentTerms: source.paymentTerms ?? undefined,
    itinerary: source.itinerary ?? [],
    requirements: source.requirements ?? [],
    images: source.images ?? [],
    bannerUrl: source.bannerUrl ?? null,
    signupUrl: source.signupUrl ?? null,
    priceAed: source.priceAed,
    pricePackages: source.pricePackages ?? [],
    pricingMode: source.pricingMode ?? undefined,
    capacity: source.capacity,
    status: ActivityStatus.DRAFT
  });

  return created;
};

export const publishActivityById = async (activityId: string) => {
  const publishedAt = new Date();
  await patchActivityInMongo(activityId, { status: ActivityStatus.PUBLISHED, publishedAt });
  const mongoDoc = await findActivityDocInMongo(activityId);
  if (!mongoDoc) {
    throw new Error('Failed to publish event.');
  }
  return mapMongoActivityToPublishResult({ ...mongoDoc, status: ActivityStatus.PUBLISHED, publishedAt });
};

export const listSubmittedLocationsByUser = async (userId: string) => {
  const items = await locationsCollection()
    .find({ submittedById: userId })
    .sort({ createdAt: -1 })
    .toArray();
  return items.map(mapMongoLocation);
};

export const createLocationRecord = async (data: Parameters<typeof buildLocationFromCreateInput>[0]) => {
  const locationId = newEntityId();
  const location = buildLocationFromCreateInput(data, locationId);
  await writeLocationToMongo(location);
  return location;
};

export const listTenantActivityHistoryWithParticipation = async (input: {
  tenantId: string;
  skip: number;
  take: number;
}) => {
  const mongoResult = await listTenantActivitiesFromMongo({
    tenantId: input.tenantId,
    skip: input.skip,
    take: input.take,
    sortDirection: -1,
    startBefore: new Date()
  });

  return {
    items: mongoResult.items.map((event) => ({
      ...event,
      participants: event.participants.map((participant) => ({
        id: participant.id,
        checkedInAt: participant.checkedInAt ?? null
      }))
    })),
    total: mongoResult.total
  };
};

export const listPopularActiveLocations = async (limit: number) => {
  const items = await locationsCollection()
    .find({ status: LocationStatus.ACTIVE })
    .sort({ featured: -1, viewCount: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return items.map(mapMongoLocation);
};

export const listPublishedUpcomingActivitiesByLocation = async (locationId: string, take: number) =>
  listPublishedUpcomingActivitiesByLocationFromMongo(locationId, take);

export const findActiveLocationById = async (locationId: string) => {
  const item = await locationsCollection().findOne({ _id: locationId, status: LocationStatus.ACTIVE });
  return item ? mapMongoLocation(item) : null;
};

export const incrementActiveLocationViewCount = async (locationId: string) => {
  const updated = await locationsCollection().updateOne(
    { _id: locationId, status: LocationStatus.ACTIVE },
    { $inc: { viewCount: 1 } }
  );
  return { count: updated.modifiedCount };
};

export const findPublicTenantProfileBySlug = async (slug: string) =>
  findPublicTenantProfileBySlugFromMongo(slug);

export const listFeaturedPublishedActivities = async (take: number) =>
  listFeaturedPublishedActivitiesFromMongo(take);

export const listPublishedActivitiesForExploreMap = async (take = 250) =>
  listPublishedActivitiesForExploreMapFromMongo(take);

export const listPublishedActivitiesWithPreviews = async (input: {
  skip: number;
  take: number;
  when?: 'upcoming' | 'past' | 'all';
}) => listPublishedActivitiesWithPreviewsFromMongo(input);

export const findPublishedActivityWithPreviewsById = async (activityId: string) =>
  findPublishedActivityWithPreviewsFromMongo(activityId);

export const findActivityTimingById = async (activityId: string) => {
  const item = await activitiesCollection().findOne({ _id: activityId });
  if (!item) return null;
  return {
    startAt: item.startAt,
    endAt: item.endAt,
    status: item.status
  };
};

export const listActivitiesForRequestViews = async (eventIds: string[]) =>
  listActivitiesByIdsFromMongo(eventIds);

export const listActivitiesForTripViews = async (eventIds: string[]) =>
  listActivitiesByIdsFromMongo(eventIds);

export const findActivityForRequestViewById = async (activityId: string) => {
  const [event] = await listActivitiesByIdsFromMongo([activityId]);
  return event ?? null;
};
