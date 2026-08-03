import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { EventStatus, LocationStatus } from '../domain/enums.js';
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
} from './event-read-assembler.js';
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
  getMongoClient()!.db().collection<MongoEventDoc>('events');

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
  whereExtra?: { status?: EventStatus };
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
  const eventId = newEntityId();
  const mongoDoc = buildEventFromCreateInput(data, eventId);
  await writeEventDocToMongo(mongoDoc);

  const created = await findTenantEventFromMongo(eventId, mongoDoc.tenantId);
  if (!created) {
    throw new Error('Failed to persist event record.');
  }
  return created;
};

export const findTenantEventForEdit = async (eventId: string, tenantId: string) =>
  findTenantEventFromMongo(eventId, tenantId);

export const updateEventDetailed = async (
  eventId: string,
  data: EventUpdateInput
): Promise<EventWithTenantRelations> => {
  const patch: Partial<MongoEventDoc> = { updatedAt: new Date() };
  if (data.title !== undefined) patch.title = data.title;
  if (data.startAt !== undefined) patch.startAt = data.startAt;
  if (data.endAt !== undefined) patch.endAt = data.endAt;
  if (data.status !== undefined) patch.status = data.status as EventStatus;
  if (data.capacity !== undefined) patch.capacity = data.capacity;
  if (data.priceAed !== undefined) patch.priceAed = data.priceAed;
  if (data.featured !== undefined) patch.featured = data.featured;
  if (data.description !== undefined) patch.description = data.description;
  if (data.meetingPoint !== undefined) patch.meetingPoint = data.meetingPoint;
  if (data.meetingLat !== undefined) patch.meetingLat = data.meetingLat;
  if (data.meetingLng !== undefined) patch.meetingLng = data.meetingLng;
  if (data.parkingPoint !== undefined) patch.parkingPoint = data.parkingPoint;
  if (data.parkingLat !== undefined) patch.parkingLat = data.parkingLat;
  if (data.parkingLng !== undefined) patch.parkingLng = data.parkingLng;
  if (data.meetingDifferent !== undefined) patch.meetingDifferent = data.meetingDifferent;
  if (data.carPoolEnabled !== undefined) patch.carPoolEnabled = data.carPoolEnabled;
  if (data.carPoolFree !== undefined) patch.carPoolFree = data.carPoolFree;
  if (data.carPoolPriceAed !== undefined) patch.carPoolPriceAed = data.carPoolPriceAed;
  if (data.carPoolDetails !== undefined) patch.carPoolDetails = data.carPoolDetails;
  if (data.paymentTerms !== undefined) patch.paymentTerms = data.paymentTerms;
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

  await patchEventInMongo(eventId, patch);

  const existing = await findEventDocInMongo(eventId);
  if (!existing) {
    throw new Error('Failed to update event record.');
  }

  const updated = await findTenantEventFromMongo(eventId, existing.tenantId);
  if (!updated) {
    throw new Error('Failed to update event record.');
  }
  return updated;
};

export const findTenantEventWithParticipants = async (eventId: string, tenantId: string) =>
  findTenantEventFromMongo(eventId, tenantId);

export const findTenantEventById = async (eventId: string, tenantId: string) =>
  findTenantEventFromMongo(eventId, tenantId);

export const findTenantEventBasic = async (eventId: string, tenantId: string) => {
  const doc = await findTenantEventDocFromMongo(eventId, tenantId);
  if (!doc) return null;
  return { id: doc._id, title: doc.title, capacity: doc.capacity };
};

export const cancelEventById = async (eventId: string) => {
  await patchEventInMongo(eventId, { status: EventStatus.CANCELLED });
  const mongoDoc = await findEventDocInMongo(eventId);
  if (!mongoDoc) {
    throw new Error('Failed to cancel event.');
  }
  return mapMongoEventToPublishResult({ ...mongoDoc, status: EventStatus.CANCELLED });
};

export const publishEventById = async (eventId: string) => {
  const publishedAt = new Date();
  await patchEventInMongo(eventId, { status: EventStatus.PUBLISHED, publishedAt });
  const mongoDoc = await findEventDocInMongo(eventId);
  if (!mongoDoc) {
    throw new Error('Failed to publish event.');
  }
  return mapMongoEventToPublishResult({ ...mongoDoc, status: EventStatus.PUBLISHED, publishedAt });
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
    .sort({ viewCount: -1, createdAt: -1 })
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

export const listPublishedEventsWithPreviews = async (input: { skip: number; take: number }) =>
  listPublishedEventsWithPreviewsFromMongo(input);

export const findPublishedEventWithPreviewsById = async (eventId: string) =>
  findPublishedEventWithPreviewsFromMongo(eventId);

export const findEventTimingById = async (eventId: string) => {
  const item = await eventsCollection().findOne({ _id: eventId });
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

export const findEventForRequestViewById = async (eventId: string) => {
  const [event] = await listEventsByIdsFromMongo([eventId]);
  return event ?? null;
};
