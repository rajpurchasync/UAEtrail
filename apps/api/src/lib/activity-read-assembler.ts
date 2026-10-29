import {
  type OutingCategory,
  type OutingTopic,
} from '@uaetrail/shared-types';
import type { Collection } from 'mongodb';
import type { Activity, ActivityParticipant, Location } from '../domain/types.js';
import { resolveJoinMode, shouldHideActivityFromExploreMap } from '../domain/activity-join-mode.js';
import { ActivityStatus, LocationStatus } from '../domain/enums.js';
import { findAuthUsersByIds, type AuthUserRecord } from './auth-users-store.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { findTenantBySlug, findTenantsByIds, type TenantRecord } from './tenant-store.js';

const tenantMapForIds = async (tenantIds: string[]): Promise<Map<string, TenantRecord>> => {
  const unique = [...new Set(tenantIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  return findTenantsByIds(unique);
};

type MongoActivityParticipant = {
  _id: string;
  activityId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  hostRatingScore?: number | null;
  hostRatingComment?: string | null;
  hostRatedAt?: Date | null;
  createdAt: Date;
};

type MongoLocationDoc = Omit<Location, 'id'> & {
  _id: string;
  geo?: unknown;
};

export type ActivityWithPublicRelations = Activity & {
  location: Location;
  tenant: Pick<
    TenantRecord,
    | 'id'
    | 'slug'
    | 'name'
    | 'countryCode'
    | 'ownerId'
    | 'type'
    | 'businessMode'
    | 'publishingPurpose'
    | 'logoUrl'
  >;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null };
  createdBy: { profile: { displayName: string | null } | null };
  tenantOwner: { profile: { displayName: string | null } | null };
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

type RetiredRideshareMongoFields = {
  carPoolEnabled?: boolean;
  carPoolFree?: boolean | null;
  carPoolPriceAed?: number | null;
  carPoolSeats?: number | null;
  carPoolDetails?: string | null;
  linkedCarpoolActivityId?: string | null;
};

const mongoEventToEvent = (doc: MongoActivityDoc): Activity => {
  const retired = doc as MongoActivityDoc & RetiredRideshareMongoFields;
  return {
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
  rideshareEnabled: retired.rideshareEnabled ?? retired.carPoolEnabled ?? false,
  rideshareFree: retired.rideshareFree ?? retired.carPoolFree ?? null,
  ridesharePriceAed: retired.ridesharePriceAed ?? retired.carPoolPriceAed ?? null,
  rideshareSeats: retired.rideshareSeats ?? retired.carPoolSeats ?? null,
  rideshareDetails: retired.rideshareDetails ?? retired.carPoolDetails ?? null,
  rideshareVehicleId: doc.rideshareVehicleId ?? null,
  rideshareVehicle: doc.rideshareVehicle ?? null,
  linkedActivityId: doc.linkedActivityId ?? null,
  linkedRideshareActivityId:
    retired.linkedRideshareActivityId ?? retired.linkedCarpoolActivityId ?? null,
  paymentTerms: doc.paymentTerms,
  pricingMode: doc.pricingMode ?? null,
  itinerary: doc.itinerary,
  requirements: doc.requirements,
  joinMode: resolveJoinMode(doc.joinMode, doc.requirements),
  images: doc.images,
  bannerUrl: doc.bannerUrl ?? null,
  signupUrl: doc.signupUrl ?? null,
  priceAed: doc.priceAed,
  pricePackages: doc.pricePackages,
  capacity: doc.capacity,
  status: doc.status,
  featured: doc.featured,
  publishedAt: doc.publishedAt,
  outingCategory: (doc.outingCategory as OutingCategory | null | undefined) ?? null,
  outingTopic: (doc.outingTopic as OutingTopic | null | undefined) ?? null,
  areaId: doc.areaId ?? null,
  groupRegionLevels: doc.groupRegionLevels ?? null,
  activityMode: doc.activityMode ?? null,
  participantIntentId: doc.participantIntentId ?? null,
  groupChatPostPolicy: doc.groupChatPostPolicy ?? null,
  guides: doc.guides ?? [],
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  };
};

const toPublicActivityTenant = (
  tenant: Pick<
    TenantRecord,
    | 'id'
    | 'slug'
    | 'name'
    | 'countryCode'
    | 'ownerId'
    | 'type'
    | 'businessMode'
    | 'publishingPurpose'
    | 'logoUrl'
  >
): ActivityWithPublicRelations['tenant'] => ({
  id: tenant.id,
  slug: tenant.slug,
  name: tenant.name,
  countryCode: tenant.countryCode,
  ownerId: tenant.ownerId,
  type: tenant.type,
  businessMode: tenant.businessMode,
  publishingPurpose: tenant.publishingPurpose,
  logoUrl: tenant.logoUrl ?? null,
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

const loadLocationsByIds = async (
  locationIds: string[],
  activeOnly = false
): Promise<Map<string, Location>> => {
  const uniqueIds = [...new Set(locationIds.filter(Boolean))];
  const map = new Map<string, Location>();
  if (uniqueIds.length === 0) return map;

  const query = activeOnly
    ? { _id: { $in: uniqueIds }, status: LocationStatus.ACTIVE }
    : { _id: { $in: uniqueIds } };

  const docs = await locationsCollection().find(query).toArray();
  for (const doc of docs) {
    map.set(doc._id, mapMongoLocation(doc));
  }

  return map;
};

const assembleEventsWithPublicRelations = async (
  docs: MongoActivityDoc[]
): Promise<ActivityWithPublicRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(docs.map((doc) => doc.locationId), false);
  const filteredDocs = docs.filter((doc) => locationMap.has(doc.locationId));
  if (filteredDocs.length === 0) return [];

  const tenantMap = await tenantMapForIds(filteredDocs.map((doc) => doc.tenantId));

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
  for (const tenant of tenantMap.values()) {
    if (tenant.ownerId) userIds.add(tenant.ownerId);
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
      hostRatingScore: participant.hostRatingScore ?? null,
      hostRatingComment: participant.hostRatingComment ?? null,
      hostRatedAt: participant.hostRatedAt ?? null,
      createdAt: participant.createdAt,
      user: toParticipantUser(userMap.get(participant.userId))
    }));

    return [
      {
        ...mongoEventToEvent(doc),
        location,
        tenant: toPublicActivityTenant(tenant),
        guide: doc.hostId ? toGuidePreview(userMap.get(doc.hostId)) : { profile: null },
        createdBy: (() => {
          const creator = userMap.get(doc.createdById);
          return creator ? { profile: { displayName: creator.profile.displayName } } : { profile: null };
        })(),
        tenantOwner: (() => {
          const owner = userMap.get(tenant.ownerId);
          return owner ? { profile: { displayName: owner.profile.displayName } } : { profile: null };
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
  const locations = await loadLocationsByIds(docs.map((doc) => doc.locationId), false);
  const now = new Date();
  return docs.filter((doc) => {
    if (doc.status !== ActivityStatus.PUBLISHED) return false;
    if (!locations.has(doc.locationId)) return false;
    if (shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)) return false;
    if (
      when === 'upcoming' &&
      doc.activityMode !== 'seeking' &&
      doc.startAt < now
    ) {
      return false;
    }
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
    .find({
      status: ActivityStatus.PUBLISHED,
      joinMode: { $ne: 'private' },
      $or: [
        { startAt: { $gte: startOfToday } },
        /** Member “looking for” stays discoverable while published — not gated like fixed hosted departures. */
        { activityMode: 'seeking' },
      ],
    })
    .sort({ startAt: 1 })
    .limit(Math.max(take * 8, 200))
    .toArray();

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );

  const filtered = await filterPublishedDocs(visible, 'upcoming');
  const assembled = await assembleEventsForExploreMap(filtered);
  return assembled.slice(0, take);
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

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible);
};

/** Published upcoming outings hosted or created by a member (public profile). */
export const listPublishedUpcomingActivitiesByMemberFromMongo = async (
  userId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> => {
  const docs = await activitiesCollection()
    .find({
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: new Date() },
      $or: [{ hostId: userId }, { createdById: userId }],
    })
    .sort({ startAt: 1 })
    .limit(Math.max(take, 1) * 3)
    .toArray();

  const filtered = await filterPublishedDocs(docs, 'upcoming');
  const visible = filtered.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible.slice(0, take));
};

/** Upcoming public map activities tagged with a curated area. */
export const listPublishedUpcomingActivitiesByAreaFromMongo = async (
  areaId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const locationIds = await locationsCollection()
    .find({ areaId, status: LocationStatus.ACTIVE })
    .project({ _id: 1 })
    .limit(500)
    .toArray();
  const locationIdList = locationIds.map((row) => row._id);

  const docs = await activitiesCollection()
    .find({
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: startOfToday },
      joinMode: { $ne: 'private' },
      $or: [
        { locationId: { $in: locationIdList } },
        { areaId },
      ],
    })
    .sort({ startAt: 1 })
    .limit(Math.max(take, 1) * 3)
    .toArray();

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible.slice(0, take));
};

/** Active catalog places linked to a curated area (`place.areaId`). */
export const listActiveCatalogPlacesByAreaFromMongo = async (
  areaId: string,
  take: number
): Promise<Location[]> => {
  const docs = await locationsCollection()
    .find({
      areaId,
      status: LocationStatus.ACTIVE,
      $or: [{ registryListed: { $exists: false } }, { registryListed: { $ne: false } }],
    })
    .sort({ name: 1 })
    .limit(Math.max(take, 1))
    .toArray();

  return docs.map((doc) => mapMongoLocation(doc));
};

export type ActivityWithTenantRelations = Activity & {
  location: Location;
  tenant: TenantRecord;
  guide: { profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null } | null;
  createdBy: { profile: { displayName: string | null } | null } | null;
  tenantOwner: { profile: { displayName: string | null } | null };
  participants: Array<{ id: string; userId: string; checkedInAt?: Date | null }>;
};

/** Like assembleEventsWithPublicRelations but includes draft/inactive venues (for explore map). */
const assembleEventsForExploreMap = async (
  docs: MongoActivityDoc[]
): Promise<ActivityWithPublicRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(
    docs.map((doc) => doc.locationId),
    false
  );
  const filteredDocs = docs.filter((doc) => locationMap.has(doc.locationId));
  if (filteredDocs.length === 0) return [];

  const tenantMap = await tenantMapForIds(filteredDocs.map((doc) => doc.tenantId));

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
  for (const tenant of tenantMap.values()) {
    if (tenant.ownerId) userIds.add(tenant.ownerId);
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
      hostRatingScore: participant.hostRatingScore ?? null,
      hostRatingComment: participant.hostRatingComment ?? null,
      hostRatedAt: participant.hostRatedAt ?? null,
      createdAt: participant.createdAt,
      user: toParticipantUser(userMap.get(participant.userId))
    }));

    return [
      {
        ...mongoEventToEvent(doc),
        location,
        tenant: toPublicActivityTenant(tenant),
        guide: doc.hostId ? toGuidePreview(userMap.get(doc.hostId)) : { profile: null },
        createdBy: (() => {
          const creator = userMap.get(doc.createdById);
          return creator ? { profile: { displayName: creator.profile.displayName } } : { profile: null };
        })(),
        tenantOwner: (() => {
          const owner = userMap.get(tenant.ownerId);
          return owner ? { profile: { displayName: owner.profile.displayName } } : { profile: null };
        })(),
        participants
      }
    ];
  });
};

const assembleTenantEventsWithRelations = async (
  docs: MongoActivityDoc[]
): Promise<ActivityWithTenantRelations[]> => {
  if (docs.length === 0) return [];

  const locationMap = await loadLocationsByIds(docs.map((doc) => doc.locationId));
  const tenantMap = await tenantMapForIds(docs.map((doc) => doc.tenantId));

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
  const userIds = new Set<string>([...hostIds, ...createdByIds]);
  for (const tenant of tenantMap.values()) {
    if (tenant.ownerId) userIds.add(tenant.ownerId);
  }
  const users = await findAuthUsersByIds([...userIds]);
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
        tenantOwner: (() => {
          const owner = userMap.get(tenant.ownerId);
          return owner ? { profile: { displayName: owner.profile.displayName } } : { profile: null };
        })(),
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
