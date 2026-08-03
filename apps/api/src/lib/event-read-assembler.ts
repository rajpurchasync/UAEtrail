import type { Collection } from 'mongodb';
import type { Event, EventParticipant, Location } from '../domain/types.js';
import { EventStatus, LocationStatus } from '../domain/enums.js';
import { findAuthUsersByIds, type AuthUserRecord } from './auth-users.js';
import type { MongoEventDoc } from './entity-builders.js';
import { findLocationInMongo } from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { findTenantById, findTenantBySlug, type TenantRecord } from './tenant-store.js';

type MongoEventParticipant = {
  _id: string;
  eventId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  createdAt: Date;
};

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: unknown;
};

export type EventWithPublicRelations = Event & {
  location: Location;
  tenant: Pick<TenantRecord, 'id' | 'slug' | 'name' | 'countryCode' | 'ownerId'>;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null };
  participants: Array<
    EventParticipant & {
      user: { email: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
    }
  >;
};

const eventsCollection = (): Collection<MongoEventDoc> =>
  getMongoClient()!.db().collection<MongoEventDoc>('events');

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const eventParticipantsCollection = (): Collection<MongoEventParticipant> =>
  getMongoClient()!.db().collection<MongoEventParticipant>('event_participants');

const mapMongoLocation = (doc: MongoLocationDoc): Location => {
  const { _id, geo: _geo, ...rest } = doc;
  return { id: _id, ...rest };
};

const mongoEventToEvent = (doc: MongoEventDoc): Event => ({
  id: doc._id,
  tenantId: doc.tenantId,
  locationId: doc.locationId,
  createdById: doc.createdById,
  guideId: doc.guideId,
  title: doc.title,
  description: doc.description,
  startAt: doc.startAt,
  endAt: doc.endAt,
  meetingPoint: doc.meetingPoint,
  meetingLat: doc.meetingLat,
  meetingLng: doc.meetingLng,
  parkingPoint: doc.parkingPoint,
  parkingLat: doc.parkingLat,
  parkingLng: doc.parkingLng,
  meetingDifferent: doc.meetingDifferent,
  carPoolEnabled: doc.carPoolEnabled,
  carPoolFree: doc.carPoolFree,
  carPoolPriceAed: doc.carPoolPriceAed,
  carPoolDetails: doc.carPoolDetails,
  paymentTerms: doc.paymentTerms,
  itinerary: doc.itinerary,
  requirements: doc.requirements,
  images: doc.images,
  priceAed: doc.priceAed,
  pricePackages: doc.pricePackages,
  capacity: doc.capacity,
  status: doc.status,
  featured: doc.featured,
  publishedAt: doc.publishedAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const toGuidePreview = (user: AuthUserRecord | undefined) =>
  user
    ? {
        profile: {
          displayName: user.profile.displayName,
          avatarUrl: user.profile.avatarUrl,
          bio: user.profile.bio
        }
      }
    : { profile: null };

const toParticipantUser = (user: AuthUserRecord | undefined) => ({
  email: user?.email ?? '',
  profile: user
    ? {
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl
      }
    : null
});

const loadActiveLocations = async (locationIds: string[]): Promise<Map<string, Location>> => {
  const uniqueIds = [...new Set(locationIds)];
  const map = new Map<string, Location>();

  if (uniqueIds.length === 0) return map;

  const docs = await locationsCollection()
    .find({ _id: { $in: uniqueIds }, status: LocationStatus.ACTIVE })
    .toArray();

  for (const doc of docs) {
    map.set(doc._id, mapMongoLocation(doc));
  }

  for (const id of uniqueIds) {
    if (map.has(id)) continue;
    const fallback = await findLocationInMongo(id);
    if (fallback && fallback.status === LocationStatus.ACTIVE) {
      map.set(id, fallback);
    }
  }

  return map;
};

export const assembleEventsWithPublicRelations = async (
  docs: MongoEventDoc[]
): Promise<EventWithPublicRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadActiveLocations(docs.map((doc) => doc.locationId));
  const filteredDocs = docs.filter((doc) => locationMap.has(doc.locationId));
  if (filteredDocs.length === 0) return [];

  const tenantIds = [...new Set(filteredDocs.map((doc) => doc.tenantId))];
  const tenantEntries = await Promise.all(
    tenantIds.map(async (tenantId) => [tenantId, await findTenantById(tenantId)] as const)
  );
  const tenantMap = new Map(tenantEntries.filter((entry): entry is [string, TenantRecord] => Boolean(entry[1])));

  const eventIds = filteredDocs.map((doc) => doc._id);
  const participantDocs = await eventParticipantsCollection().find({ eventId: { $in: eventIds } }).toArray();
  const participantsByEvent = new Map<string, MongoEventParticipant[]>();
  for (const participant of participantDocs) {
    const list = participantsByEvent.get(participant.eventId) ?? [];
    list.push(participant);
    participantsByEvent.set(participant.eventId, list);
  }

  const userIds = new Set<string>();
  for (const doc of filteredDocs) {
    if (doc.guideId) userIds.add(doc.guideId);
  }
  for (const participant of participantDocs) {
    userIds.add(participant.userId);
  }

  const users = await findAuthUsersByIds([...userIds]);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return filteredDocs.flatMap((doc) => {
    const location = locationMap.get(doc.locationId);
    const tenant = tenantMap.get(doc.tenantId);
    if (!location || !tenant) return [];

    const participants = (participantsByEvent.get(doc._id) ?? []).map((participant) => ({
      id: participant._id,
      eventId: participant.eventId,
      requestId: participant.requestId,
      userId: participant.userId,
      approvedById: participant.approvedById,
      checkedInAt: participant.checkedInAt,
      createdAt: participant.createdAt,
      user: toParticipantUser(userMap.get(participant.userId))
    }));

    return [
      {
        ...mongoEventToEvent(doc),
        location,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          countryCode: tenant.countryCode,
          ownerId: tenant.ownerId
        },
        guide: doc.guideId ? toGuidePreview(userMap.get(doc.guideId)) : { profile: null },
        participants
      }
    ];
  });
};

const filterPublishedUpcomingDocs = async (docs: MongoEventDoc[]): Promise<MongoEventDoc[]> => {
  const activeLocations = await loadActiveLocations(docs.map((doc) => doc.locationId));
  const now = new Date();
  return docs.filter(
    (doc) =>
      doc.status === EventStatus.PUBLISHED &&
      doc.startAt >= now &&
      activeLocations.has(doc.locationId)
  );
};

export const listFeaturedPublishedEventsFromMongo = async (take: number): Promise<EventWithPublicRelations[]> => {
  const docs = await eventsCollection()
    .find({
      status: EventStatus.PUBLISHED,
      featured: true,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(take * 2)
    .toArray();

  const filtered = await filterPublishedUpcomingDocs(docs);
  return assembleEventsWithPublicRelations(filtered.slice(0, take));
};

export const listPublishedEventsWithPreviewsFromMongo = async (input: {
  skip: number;
  take: number;
}): Promise<{ items: EventWithPublicRelations[]; total: number }> => {
  const docs = await eventsCollection()
    .find({ status: EventStatus.PUBLISHED })
    .sort({ startAt: 1 })
    .toArray();

  const filtered = await filterPublishedUpcomingDocs(docs);
  const items = await assembleEventsWithPublicRelations(filtered.slice(input.skip, input.skip + input.take));
  return { items, total: filtered.length };
};

export const findPublishedEventWithPreviewsFromMongo = async (
  eventId: string
): Promise<EventWithPublicRelations | null> => {
  const doc = await eventsCollection().findOne({ _id: eventId, status: EventStatus.PUBLISHED });
  if (!doc) return null;

  const [event] = await assembleEventsWithPublicRelations([doc]);
  return event ?? null;
};

export const listPublishedUpcomingEventsByLocationFromMongo = async (
  locationId: string,
  take: number
): Promise<EventWithPublicRelations[]> => {
  const docs = await eventsCollection()
    .find({
      locationId,
      status: EventStatus.PUBLISHED,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(take)
    .toArray();

  return assembleEventsWithPublicRelations(docs);
};

export const countPublishedEventsInMongo = async (): Promise<number> => {
  const docs = await eventsCollection().find({ status: EventStatus.PUBLISHED }).toArray();
  const filtered = await filterPublishedUpcomingDocs(docs);
  return filtered.length;
};

export type EventWithTenantRelations = Event & {
  location: Location;
  tenant: TenantRecord;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null } | null;
  participants: Array<{ id: string; userId: string; checkedInAt?: Date | null }>;
};

const loadLocationsByIds = async (
  locationIds: string[],
  activeOnly = false
): Promise<Map<string, Location>> => {
  const uniqueIds = [...new Set(locationIds)];
  const map = new Map<string, Location>();
  if (uniqueIds.length === 0) return map;

  const query = activeOnly
    ? { _id: { $in: uniqueIds }, status: LocationStatus.ACTIVE }
    : { _id: { $in: uniqueIds } };

  const docs = await locationsCollection().find(query).toArray();
  for (const doc of docs) {
    map.set(doc._id, mapMongoLocation(doc));
  }

  for (const id of uniqueIds) {
    if (map.has(id)) continue;
    const fallback = await findLocationInMongo(id);
    if (fallback && (!activeOnly || fallback.status === LocationStatus.ACTIVE)) {
      map.set(id, fallback);
    }
  }

  return map;
};

export const assembleTenantEventsWithRelations = async (
  docs: MongoEventDoc[]
): Promise<EventWithTenantRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(docs.map((doc) => doc.locationId));
  const tenantIds = [...new Set(docs.map((doc) => doc.tenantId))];
  const tenantEntries = await Promise.all(
    tenantIds.map(async (tenantId) => [tenantId, await findTenantById(tenantId)] as const)
  );
  const tenantMap = new Map(tenantEntries.filter((entry): entry is [string, TenantRecord] => Boolean(entry[1])));

  const eventIds = docs.map((doc) => doc._id);
  const participantDocs = await eventParticipantsCollection().find({ eventId: { $in: eventIds } }).toArray();
  const participantsByEvent = new Map<string, MongoEventParticipant[]>();
  for (const participant of participantDocs) {
    const list = participantsByEvent.get(participant.eventId) ?? [];
    list.push(participant);
    participantsByEvent.set(participant.eventId, list);
  }

  const guideIds = docs.map((doc) => doc.guideId).filter((id): id is string => Boolean(id));
  const guideUsers = await findAuthUsersByIds(guideIds);
  const guideMap = new Map(guideUsers.map((user) => [user._id, user]));

  return docs.flatMap((doc) => {
    const location = locationMap.get(doc.locationId);
    const tenant = tenantMap.get(doc.tenantId);
    if (!location || !tenant) return [];

    return [
      {
        ...mongoEventToEvent(doc),
        location,
        tenant,
        guide: doc.guideId ? toGuidePreview(guideMap.get(doc.guideId)) : { profile: null },
        participants: (participantsByEvent.get(doc._id) ?? []).map((participant) => ({
          id: participant._id,
          userId: participant.userId,
          checkedInAt: participant.checkedInAt
        }))
      }
    ];
  });
};

export const listTenantEventsFromMongo = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  sortDirection?: 1 | -1;
  status?: EventStatus;
  startBefore?: Date;
}): Promise<{ items: EventWithTenantRelations[]; total: number }> => {
  const filter: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.status) filter.status = input.status;
  if (input.startBefore) filter.startAt = { $lt: input.startBefore };

  const [docs, total] = await Promise.all([
    eventsCollection()
      .find(filter)
      .sort({ startAt: input.sortDirection ?? 1 })
      .skip(input.skip)
      .limit(input.take)
      .toArray(),
    eventsCollection().countDocuments(filter)
  ]);

  if (total === 0) return { items: [], total: 0 };
  const items = await assembleTenantEventsWithRelations(docs);
  return { items, total };
};

export const findTenantEventFromMongo = async (
  eventId: string,
  tenantId: string
): Promise<EventWithTenantRelations | null> => {
  const doc = await eventsCollection().findOne({ _id: eventId, tenantId });
  if (!doc) return null;

  const [event] = await assembleTenantEventsWithRelations([doc]);
  return event ?? null;
};

export const findTenantEventDocFromMongo = async (
  eventId: string,
  tenantId: string
): Promise<MongoEventDoc | null> => eventsCollection().findOne({ _id: eventId, tenantId });

export const listEventsByIdsFromMongo = async (eventIds: string[]): Promise<EventWithPublicRelations[]> => {
  if (eventIds.length === 0) return [];
  const docs = await eventsCollection().find({ _id: { $in: eventIds } }).toArray();
  return assembleEventsWithPublicRelations(docs);
};

export type PublicTenantProfile = TenantRecord & {
  owner: AuthUserRecord;
  memberships: Array<{
    role: string;
    user: { email: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
  }>;
  events: EventWithPublicRelations[];
};

export const findPublicTenantProfileBySlugFromMongo = async (
  slug: string
): Promise<PublicTenantProfile | null> => {
  const tenant = await findTenantBySlug(slug);
  if (!tenant || tenant.status !== 'ACTIVE') return null;

  const owner = await findAuthUsersByIds([tenant.ownerId]).then((users) => users[0]);
  if (!owner) return null;

  const membershipDocs = await getMongoClient()!
    .db()
    .collection('tenant_memberships')
    .find({ tenantId: tenant.id })
    .sort({ createdAt: 1 })
    .toArray();

  const memberUserIds = membershipDocs.map((doc) => doc.userId as string);
  const memberUsers = await findAuthUsersByIds(memberUserIds);
  const memberUserMap = new Map(memberUsers.map((user) => [user._id, user]));

  const eventDocs = await eventsCollection()
    .find({
      tenantId: tenant.id,
      status: EventStatus.PUBLISHED,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(20)
    .toArray();

  const events = await assembleEventsWithPublicRelations(eventDocs);

  return {
    ...tenant,
    owner,
    memberships: membershipDocs.map((doc) => ({
      role: doc.role as string,
      user: toParticipantUser(memberUserMap.get(doc.userId as string))
    })),
    events
  };
};
