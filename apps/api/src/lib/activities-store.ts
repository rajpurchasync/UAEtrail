import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import {
  buildEventFromCreateInput,
  buildLocationFromCreateInput,
  newEntityId,
  type EventCreateInput,
  type EventUpdateInput,
  type MongoEventDoc
} from './entity-builders.js';
import {
  findPublishedEventWithPreviewsFromMongo,
  findPublicTenantProfileBySlugFromMongo,
  findTenantEventDocFromMongo,
  findTenantEventFromMongo,
  listEventsByIdsFromMongo,
  listFeaturedPublishedEventsFromMongo,
  listPublishedEventsWithPreviewsFromMongo,
  listPublishedUpcomingEventsByLocationFromMongo,
  listTenantEventsFromMongo,
  type EventWithTenantRelations
} from './activity-read-assembler.js';
import {
  findEventDocInMongo,
  findLocationInMongo,
  mapMongoEventToPublishResult,
  patchEventInMongo,
  writeEventDocToMongo,
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

const eventsCollection = (): Collection<MongoEventDoc> =>
  getMongoClient()!.db().collection<MongoEventDoc>('activities');

const mapMongoLocation = (doc: MongoLocationDoc): Location => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

export const findLocationById = async (locationId: string) => findLocationInMongo(locationId);

export const listTenantEventsDetailed = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  orderBy?: { startAt?: 'asc' | 'desc' };
  whereExtra?: { status?: ActivityStatus };
}) => {
  const sortDirection = input.orderBy?.startAt === 'desc' ? -1 : 1;
  return listTenantEventsFromMongo({
    tenantId: input.tenantId,
    skip: input.skip,
    take: input.take,
    sortDirection,
    status: input.whereExtra?.status
  });
};

export const createEventDetailed = async (data: EventCreateInput): Promise<EventWithTenantRelations> => {
  const activityId = newEntityId();
  const mongoDoc = buildEventFromCreateInput(data, activityId);
  await writeEventDocToMongo(mongoDoc);

  const created = await findTenantEventFromMongo(activityId, mongoDoc.tenantId);
  if (!created) {
    throw new Error('Failed to persist event record.');
  }
  return created;
};

export const findTenantEventForEdit = async (activityId: string, tenantId: string) =>
  findTenantEventFromMongo(activityId, tenantId);

export const updateEventDetailed = async (
  activityId: string,
  data: EventUpdateInput
): Promise<EventWithTenantRelations> => {
  const patch: Partial<MongoEventDoc> = { updatedAt: new Date() };
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
  if (data.pricePackages !== undefined) patch.pricePackages = data.pricePackages;
  if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;
  if (data.guide !== undefined) {
    patch.guideId =
      'disconnect' in data.guide && data.guide.disconnect ? null : data.guide.connect?.id ?? null;
  }
  if (data.location?.connect?.id !== undefined) patch.locationId = data.location.connect.id;

  await patchEventInMongo(activityId, patch);

  const existing = await findEventDocInMongo(activityId);
  if (!existing) {
    throw new Error('Failed to update event record.');
  }

  const updated = await findTenantEventFromMongo(activityId, existing.tenantId);
  if (!updated) {
    throw new Error('Failed to update event record.');
  }
  return updated;
};

export const findTenantEventWithParticipants = async (activityId: string, tenantId: string) =>
  findTenantEventFromMongo(activityId, tenantId);

export const findTenantEventById = async (activityId: string, tenantId: string) =>
  findTenantEventFromMongo(activityId, tenantId);

export const findTenantEventBasic = async (activityId: string, tenantId: string) => {
  const doc = await findTenantEventDocFromMongo(activityId, tenantId);
  if (!doc) return null;
  return { id: doc._id, title: doc.title, capacity: doc.capacity };
};

export const cancelEventById = async (activityId: string) => {
  await patchEventInMongo(activityId, { status: ActivityStatus.CANCELLED });
  const mongoDoc = await findEventDocInMongo(activityId);
  if (!mongoDoc) {
    throw new Error('Failed to cancel event.');
  }
  return mapMongoEventToPublishResult({ ...mongoDoc, status: ActivityStatus.CANCELLED });
};

export const publishEventById = async (activityId: string) => {
  const publishedAt = new Date();
  await patchEventInMongo(activityId, { status: ActivityStatus.PUBLISHED, publishedAt });
  const mongoDoc = await findEventDocInMongo(activityId);
  if (!mongoDoc) {
    throw new Error('Failed to publish event.');
  }
  return mapMongoEventToPublishResult({ ...mongoDoc, status: ActivityStatus.PUBLISHED, publishedAt });
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

export const listTenantEventHistoryWithParticipation = async (input: {
  tenantId: string;
  skip: number;
  take: number;
}) => {
  const mongoResult = await listTenantEventsFromMongo({
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

export const listPublishedUpcomingEventsByLocation = async (locationId: string, take: number) =>
  listPublishedUpcomingEventsByLocationFromMongo(locationId, take);

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

export const listFeaturedPublishedEvents = async (take: number) =>
  listFeaturedPublishedEventsFromMongo(take);

export const listPublishedEventsWithPreviews = async (input: {
  skip: number;
  take: number;
  when?: 'upcoming' | 'past' | 'all';
}) => listPublishedEventsWithPreviewsFromMongo(input);

export const findPublishedEventWithPreviewsById = async (activityId: string) =>
  findPublishedEventWithPreviewsFromMongo(activityId);

export const findEventTimingById = async (activityId: string) => {
  const item = await eventsCollection().findOne({ _id: activityId });
  if (!item) return null;
  return {
    startAt: item.startAt,
    endAt: item.endAt,
    status: item.status
  };
};

export const listEventsForRequestViews = async (eventIds: string[]) =>
  listEventsByIdsFromMongo(eventIds);

export const listEventsForTripViews = async (eventIds: string[]) =>
  listEventsByIdsFromMongo(eventIds);

export const findEventForRequestViewById = async (activityId: string) => {
  const [event] = await listEventsByIdsFromMongo([activityId]);
  return event ?? null;
};
