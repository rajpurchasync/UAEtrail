import type { Collection } from 'mongodb';
import type { Activity, ActivityParticipant, Location } from '../domain/types.js';
import { ActivityStatus, ActivityType, LocationStatus } from '../domain/enums.js';
import { findAuthUsersByIds, type AuthUserRecord } from './auth-users.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { findLocationInMongo } from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { findTenantById, findTenantBySlug, type TenantRecord } from './tenant-store.js';

type MongoActivityParticipant = {
  _id: string;
  activityId: string;
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

export type ActivityWithPublicRelations = Activity & {
  location: Location;
  tenant: Pick<TenantRecord, 'id' | 'slug' | 'name' | 'countryCode' | 'ownerId'>;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null };
  createdBy: { profile: { displayName: string | null } | null };
  participants: Array<
    ActivityParticipant & {
      user: { email: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
    }
  >;
};

const activitiesCollection = (): Collection<MongoActivityDoc> =>
  getMongoClient()!.db().collection<MongoActivityDoc>('activities');

const locationsCollection = (): Collection<MongoLocationDoc> =>
  getMongoClient()!.db().collection<MongoLocationDoc>('locations');

const activityParticipantsCollection = (): Collection<MongoActivityParticipant> =>
  getMongoClient()!.db().collection<MongoActivityParticipant>('activity_participants');

const mapMongoLocation = (doc: MongoLocationDoc): Location => {
  const { _id, geo: _geo, ...rest } = doc;
  return { id: _id, ...rest };
};

const mongoEventToEvent = (doc: MongoActivityDoc) : Activity => ({
  id: doc._id,
  tenantId: doc.tenantId,
  locationId: doc.locationId,
  activityType: doc.activityType ?? null,
  createdById: doc.createdById,
  hostId: doc.hostId,
  title: doc.title,
  description: doc.description,
  startAt: doc.startAt,
  endAt: doc.endAt,
  meetingPoint: doc.meetingPoint,
  meetingLat: doc.meetingLat,
  meetingLng: doc.meetingLng,
  startPoint: doc.startPoint ?? null,
  startLat: doc.startLat ?? null,
  startLng: doc.startLng ?? null,
  parkingPoint: doc.parkingPoint,
  parkingLat: doc.parkingLat,
  parkingLng: doc.parkingLng,
  meetingDifferent: doc.meetingDifferent,
  carPoolEnabled: doc.carPoolEnabled,
  carPoolFree: doc.carPoolFree,
  carPoolPriceAed: doc.carPoolPriceAed,
  carPoolSeats: doc.carPoolSeats ?? null,
  carPoolDetails: doc.carPoolDetails,
  paymentTerms: doc.paymentTerms,
  pricingMode: doc.pricingMode ?? null,
  itinerary: doc.itinerary,
  requirements: doc.requirements,
  images: doc.images,
  bannerUrl: doc.bannerUrl ?? null,
  signupUrl: doc.signupUrl ?? null,
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

const fallbackLocationFromActivityDoc = (doc: MongoActivityDoc): Location =>
  ({
    id: doc.locationId,
    name: doc.title,
    region: '',
    activityType: ActivityType.HIKING,
    description: doc.description,
    difficulty: null,
    season: [],
    childFriendly: false,
    maxGroupSize: null,
    accessibility: null,
    images: doc.images ?? [],
    featured: false,
    status: LocationStatus.ACTIVE,
    distance: null,
    duration: null,
    elevation: null,
    campingType: null,
    latitude: doc.meetingLat ?? doc.startLat ?? doc.parkingLat ?? null,
    longitude: doc.meetingLng ?? doc.startLng ?? doc.parkingLng ?? null,
    highlights: [],
    surfaceType: [],
    tags: [],
    parkingLink: null,
    parkingLat: doc.parkingLat ?? null,
    parkingLng: doc.parkingLng ?? null,
    emirate: null,
    premiumImages: [],
    accessibleBy: [],
    viewCount: 0,
    countryCode: 'AE',
    gpxKey: null,
    guidePdfKey: null,
    guideMarkdown: null,
    guidePreview: null,
    unlockPriceAed: 0,
    submittedById: null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }) as Location;

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
  docs: MongoActivityDoc[]
): Promise<ActivityWithPublicRelations[]> => {
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
  const participantDocs = await activityParticipantsCollection().find({ activityId: { $in: eventIds } }).toArray();
  const participantsByActivity = new Map<string, MongoActivityParticipant[]>();
  for (const participant of participantDocs) {
    const list = participantsByActivity.get(participant.activityId) ?? [];
    list.push(participant);
    participantsByActivity.set(participant.activityId, list);
  }

  const userIds = new Set<string>();
  for (const doc of filteredDocs) {
    if (doc.hostId) userIds.add(doc.hostId);
    userIds.add(doc.createdById);
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

    const participants = (participantsByActivity.get(doc._id) ?? []).map((participant) => ({
      id: participant._id,
      activityId: participant.activityId,
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
        guide: doc.hostId ? toGuidePreview(userMap.get(doc.hostId)) : { profile: null },
        createdBy: (() => {
          const creator = userMap.get(doc.createdById);
          return creator ? { profile: { displayName: creator.profile.displayName } } : { profile: null };
        })(),
        participants
      }
    ];
  });
};

const filterPublishedDocs = async (
  docs: MongoActivityDoc[],
  when: 'upcoming' | 'past' | 'all'
): Promise<MongoActivityDoc[]> => {
  const activeLocations = await loadActiveLocations(docs.map((doc) => doc.locationId));
  const now = new Date();
  return docs.filter((doc) => {
    if (doc.status !== ActivityStatus.PUBLISHED) return false;
    if (!activeLocations.has(doc.locationId)) return false;
    if (when === 'upcoming' && doc.startAt < now) return false;
    if (when === 'past' && doc.startAt >= now) return false;
    return true;
  });
};

/** @deprecated Use filterPublishedDocs */
const filterPublishedUpcomingDocs = async (docs: MongoActivityDoc[]): Promise<MongoActivityDoc[]> =>
  filterPublishedDocs(docs, 'upcoming');

export const listFeaturedPublishedActivitiesFromMongo = async (take: number): Promise<ActivityWithPublicRelations[]> => {
  const docs = await activitiesCollection()
    .find({
      status: ActivityStatus.PUBLISHED,
      featured: true,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(take * 2)
    .toArray();

  const filtered = await filterPublishedUpcomingDocs(docs);
  return assembleEventsWithPublicRelations(filtered.slice(0, take));
};

export const listPublishedActivitiesWithPreviewsFromMongo = async (input: {
  skip: number;
  take: number;
  when?: 'upcoming' | 'past' | 'all';
}): Promise<{ items: ActivityWithPublicRelations[]; total: number }> => {
  const when = input.when ?? 'upcoming';
  const docs = await activitiesCollection()
    .find({ status: ActivityStatus.PUBLISHED })
    .sort({ startAt: when === 'past' ? -1 : 1 })
    .toArray();

  const filtered = await filterPublishedDocs(docs, when);
  const items = await assembleEventsWithPublicRelations(filtered.slice(input.skip, input.skip + input.take));
  return { items, total: filtered.length };
};

export const listPublishedActivitiesForExploreMapFromMongo = async (
  take = 250
): Promise<ActivityWithPublicRelations[]> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const docs = await activitiesCollection()
    .find({ status: ActivityStatus.PUBLISHED, startAt: { $gte: startOfToday } })
    .sort({ startAt: 1 })
    .limit(take)
    .toArray();

  return assembleEventsForExploreMap(docs);
};

export const findPublishedActivityWithPreviewsFromMongo = async (
  activityId: string
): Promise<ActivityWithPublicRelations | null> => {
  const doc = await activitiesCollection().findOne({ _id: activityId, status: ActivityStatus.PUBLISHED });
  if (!doc) return null;

  const [event] = await assembleEventsWithPublicRelations([doc]);
  return event ?? null;
};

export const listPublishedUpcomingActivitiesByLocationFromMongo = async (
  locationId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> => {
  const docs = await activitiesCollection()
    .find({
      locationId,
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(take)
    .toArray();

  return assembleEventsWithPublicRelations(docs);
};

export const countPublishedEventsInMongo = async (): Promise<number> => {
  const docs = await activitiesCollection().find({ status: ActivityStatus.PUBLISHED }).toArray();
  const filtered = await filterPublishedUpcomingDocs(docs);
  return filtered.length;
};

export type ActivityWithTenantRelations = Activity & {
  location: Location;
  tenant: TenantRecord;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null } | null;
  createdBy: { profile: { displayName: string | null } | null } | null;
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

/** Like assembleEventsWithPublicRelations but includes draft/inactive venues (for explore map). */
export const assembleEventsForExploreMap = async (
  docs: MongoActivityDoc[]
): Promise<ActivityWithPublicRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(
    docs.map((doc) => doc.locationId),
    false
  );
  const filteredDocs = docs.filter(
    (doc) =>
      locationMap.has(doc.locationId) ||
      (doc.meetingLat != null && doc.meetingLng != null) ||
      (doc.startLat != null && doc.startLng != null) ||
      (doc.parkingLat != null && doc.parkingLng != null)
  );
  if (filteredDocs.length === 0) return [];

  const tenantIds = [...new Set(filteredDocs.map((doc) => doc.tenantId))];
  const tenantEntries = await Promise.all(
    tenantIds.map(async (tenantId) => [tenantId, await findTenantById(tenantId)] as const)
  );
  const tenantMap = new Map(tenantEntries.filter((entry): entry is [string, TenantRecord] => Boolean(entry[1])));

  const eventIds = filteredDocs.map((doc) => doc._id);
  const participantDocs = await activityParticipantsCollection().find({ activityId: { $in: eventIds } }).toArray();
  const participantsByActivity = new Map<string, MongoActivityParticipant[]>();
  for (const participant of participantDocs) {
    const list = participantsByActivity.get(participant.activityId) ?? [];
    list.push(participant);
    participantsByActivity.set(participant.activityId, list);
  }

  const userIds = new Set<string>();
  for (const doc of filteredDocs) {
    if (doc.hostId) userIds.add(doc.hostId);
    userIds.add(doc.createdById);
  }
  for (const participant of participantDocs) {
    userIds.add(participant.userId);
  }

  const users = await findAuthUsersByIds([...userIds]);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return filteredDocs.flatMap((doc) => {
    const linkedLocation = locationMap.get(doc.locationId);
    const location = linkedLocation ?? fallbackLocationFromActivityDoc(doc);

    const tenant = tenantMap.get(doc.tenantId) ?? {
      id: doc.tenantId,
      slug: 'host',
      name: 'Host',
      countryCode: location.countryCode ?? 'AE',
      ownerId: doc.createdById
    };

    const participants = (participantsByActivity.get(doc._id) ?? []).map((participant) => ({
      id: participant._id,
      activityId: participant.activityId,
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
        guide: doc.hostId ? toGuidePreview(userMap.get(doc.hostId)) : { profile: null },
        createdBy: (() => {
          const creator = userMap.get(doc.createdById);
          return creator ? { profile: { displayName: creator.profile.displayName } } : { profile: null };
        })(),
        participants
      }
    ];
  });
};

export const assembleTenantEventsWithRelations = async (
  docs: MongoActivityDoc[]
): Promise<ActivityWithTenantRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(docs.map((doc) => doc.locationId));
  const tenantIds = [...new Set(docs.map((doc) => doc.tenantId))];
  const tenantEntries = await Promise.all(
    tenantIds.map(async (tenantId) => [tenantId, await findTenantById(tenantId)] as const)
  );
  const tenantMap = new Map(tenantEntries.filter((entry): entry is [string, TenantRecord] => Boolean(entry[1])));

  const eventIds = docs.map((doc) => doc._id);
  const participantDocs = await activityParticipantsCollection().find({ activityId: { $in: eventIds } }).toArray();
  const participantsByActivity = new Map<string, MongoActivityParticipant[]>();
  for (const participant of participantDocs) {
    const list = participantsByActivity.get(participant.activityId) ?? [];
    list.push(participant);
    participantsByActivity.set(participant.activityId, list);
  }

  const hostIds = docs.map((doc) => doc.hostId).filter((id): id is string => Boolean(id));
  const createdByIds = docs.map((doc) => doc.createdById);
  const userIds = [...new Set([...hostIds, ...createdByIds])];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return docs.flatMap((doc) => {
    const location = locationMap.get(doc.locationId);
    const tenant = tenantMap.get(doc.tenantId);
    if (!location || !tenant) return [];

    const createdByUser = userMap.get(doc.createdById);

    return [
      {
        ...mongoEventToEvent(doc),
        location,
        tenant,
        guide: doc.hostId ? toGuidePreview(userMap.get(doc.hostId)) : { profile: null },
        createdBy: createdByUser
          ? { profile: { displayName: createdByUser.profile.displayName } }
          : { profile: null },
        participants: (participantsByActivity.get(doc._id) ?? []).map((participant) => ({
          id: participant._id,
          userId: participant.userId,
          checkedInAt: participant.checkedInAt
        }))
      }
    ];
  });
};

export const listTenantActivitiesFromMongo = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  sortDirection?: 1 | -1;
  status?: ActivityStatus;
  startBefore?: Date;
}): Promise<{ items: ActivityWithTenantRelations[]; total: number }> => {
  const filter: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.status) filter.status = input.status;
  if (input.startBefore) filter.startAt = { $lt: input.startBefore };

  const [docs, total] = await Promise.all([
    activitiesCollection()
      .find(filter)
      .sort({ startAt: input.sortDirection ?? 1 })
      .skip(input.skip)
      .limit(input.take)
      .toArray(),
    activitiesCollection().countDocuments(filter)
  ]);

  if (total === 0) return { items: [], total: 0 };
  const items = await assembleTenantEventsWithRelations(docs);
  return { items, total };
};

export const findTenantActivityFromMongo = async (
  activityId: string,
  tenantId: string
): Promise<ActivityWithTenantRelations | null> => {
  const doc = await activitiesCollection().findOne({ _id: activityId, tenantId });
  if (!doc) return null;

  const [event] = await assembleTenantEventsWithRelations([doc]);
  return event ?? null;
};

export const findTenantActivityDocFromMongo = async (
  activityId: string,
  tenantId: string
): Promise<MongoActivityDoc | null> => activitiesCollection().findOne({ _id: activityId, tenantId });

export const listActivitiesByIdsFromMongo = async (eventIds: string[]): Promise<ActivityWithPublicRelations[]> => {
  if (eventIds.length === 0) return [];
  const docs = await activitiesCollection().find({ _id: { $in: eventIds } }).toArray();
  return assembleEventsWithPublicRelations(docs);
};

export type PublicTenantProfile = TenantRecord & {
  owner: AuthUserRecord;
  memberships: Array<{
    role: string;
    user: { email: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
  }>;
  activities: ActivityWithPublicRelations[];
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

  const eventDocs = await activitiesCollection()
    .find({
      tenantId: tenant.id,
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(20)
    .toArray();

  const activities = await assembleEventsWithPublicRelations(eventDocs);

  return {
    ...tenant,
    owner,
    memberships: membershipDocs.map((doc) => ({
      role: doc.role as string,
      user: toParticipantUser(memberUserMap.get(doc.userId as string))
    })),
    activities
  };
};
