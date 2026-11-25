import {
  type OutingCategory,
  type OutingTopic,
} from '@uaetrail/shared-types';
import type { Collection } from 'mongodb';
import type { Activity, ActivityParticipant, Location } from '../domain/types.js';
import { resolveJoinMode, shouldHideActivityFromExploreMap } from '../domain/activity-join-mode.js';
import { ActivityStatus, ActivityType, LocationStatus } from '../domain/enums.js';
import { findAuthUsersByIds, type AuthUserRecord } from './auth-users-store.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { findTenantBySlug, findTenantsByIds, type TenantRecord } from './tenant-store.js';
import { enrichLocationsWithHeavyReadsBatch } from './place-heavy-store.js';

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
  itinerary:
    (doc.itinerary?.length ?? 0) > 0
      ? doc.itinerary
      : (doc.itinerarySteps?.map((s) => s.title).filter(Boolean) ?? []),
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
  destinationId: doc.destinationId ?? null,
  groupRegionLevels: doc.groupRegionLevels ?? null,
  activityMode: doc.activityMode === 'seeking' ? null : doc.activityMode ?? null,
  groupChatPostPolicy: doc.groupChatPostPolicy ?? null,
  discoverCommunityId: doc.discoverCommunityId ?? null,
  guides: doc.guides ?? [],
  schemaVersion: doc.schemaVersion,
  summary: doc.summary ?? null,
  itinerarySteps: doc.itinerarySteps,
  gear: doc.gear,
  waitlist: doc.waitlist,
  counts: doc.counts,
  priceBreakdown: doc.priceBreakdown,
  policyKey: doc.policyKey,
  customPolicy: doc.customPolicy ?? null,
  audience: doc.audience,
  waiverRequired: doc.waiverRequired,
  needsReview: doc.needsReview,
  confidence: doc.confidence,
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
  const bases = docs.map((doc) => mapMongoLocation(doc));
  const enriched = await enrichLocationsWithHeavyReadsBatch(bases);
  for (const loc of enriched) {
    map.set(loc.id, loc);
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

const buildPublishedActivitiesMongoFilter = (
  when: 'upcoming' | 'past' | 'all'
): Record<string, unknown> => {
  const now = new Date();
  const base: Record<string, unknown> = {
    status: ActivityStatus.PUBLISHED,
    joinMode: { $ne: 'private' },
  };
  if (when === 'upcoming') {
    return {
      ...base,
      $or: [{ activityMode: 'seeking' }, { startAt: { $gte: now } }],
    };
  }
  if (when === 'past') {
    return { ...base, startAt: { $lt: now }, activityMode: { $ne: 'seeking' } };
  }
  return base;
};

const EXPLORE_MAP_PARTICIPANT_CAP = 12;

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
  const filter = buildPublishedActivitiesMongoFilter(when);
  const sort = { startAt: when === 'past' ? -1 : 1 } as const;
  const total = await activitiesCollection().countDocuments(filter);

  const need = input.skip + input.take;
  let mongoSkip = 0;
  const batchSize = Math.max(input.take * 3, 40);
  const collected: MongoActivityDoc[] = [];

  while (collected.length < need) {
    const batch = await activitiesCollection()
      .find(filter)
      .sort(sort)
      .skip(mongoSkip)
      .limit(batchSize)
      .toArray();
    if (batch.length === 0) break;
    const filtered = await filterPublishedDocs(batch, when);
    collected.push(...filtered);
    mongoSkip += batch.length;
    if (batch.length < batchSize) break;
  }

  const page = collected.slice(input.skip, input.skip + input.take);
  const items = await assembleEventsWithPublicRelations(page);
  return { items, total };
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
    .limit(Math.max(take + 80, take * 2))
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

/** Published upcoming rideshare children linked to a parent outing (`linkedActivityId`). */
export const listPublishedLinkedRidesByParentFromMongo = async (
  parentActivityId: string
): Promise<ActivityWithPublicRelations[]> => {
  const docs = await activitiesCollection()
    .find({
      activityType: ActivityType.RIDESHARE,
      status: ActivityStatus.PUBLISHED,
      linkedActivityId: parentActivityId,
      startAt: { $gte: new Date() },
    })
    .sort({ startAt: 1 })
    .limit(50)
    .toArray();

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible);
};

/** Published upcoming rideshare rows targeting a catalog place or linked parent outing at that place. */
export const listPublishedReachableRidesByPlaceFromMongo = async (
  placeId: string,
  destPlaceRequirementLines: string[]
): Promise<ActivityWithPublicRelations[]> => {
  const parentAtPlace = await activitiesCollection()
    .find({ locationId: placeId, status: ActivityStatus.PUBLISHED })
    .project({ _id: 1 })
    .toArray();
  const parentIds = parentAtPlace.map((row) => String(row._id));

  const orClause: Record<string, unknown>[] = [{ requirements: { $in: destPlaceRequirementLines } }];
  if (parentIds.length > 0) {
    orClause.push({ linkedActivityId: { $in: parentIds } });
  }

  const docs = await activitiesCollection()
    .find({
      activityType: ActivityType.RIDESHARE,
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: new Date() },
      $or: orClause,
    })
    .sort({ startAt: 1 })
    .limit(200)
    .toArray();

  const visible = docs.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible);
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

const listPublishedActivitiesByDiscoverCommunityFromMongo = async (input: {
  communityId: string;
  window: 'upcoming' | 'past';
  take: number;
}): Promise<ActivityWithPublicRelations[]> => {
  const now = new Date();
  const baseFilter = {
    status: ActivityStatus.PUBLISHED,
    discoverCommunityId: input.communityId,
    activityMode: { $ne: 'seeking' as const },
    joinMode: { $ne: 'private' as const },
  };
  const timeFilter =
    input.window === 'upcoming'
      ? { startAt: { $gte: now } }
      : { startAt: { $lt: now } };

  const docs = await activitiesCollection()
    .find({ ...baseFilter, ...timeFilter })
    .sort({ startAt: input.window === 'upcoming' ? 1 : -1 })
    .limit(Math.max(input.take, 1) * 3)
    .toArray();

  const filtered = await filterPublishedDocs(docs, input.window);
  const visible = filtered.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible.slice(0, input.take));
};

/** Upcoming published outings for a discoverable community. */
export const listPublishedUpcomingActivitiesByDiscoverCommunityFromMongo = async (
  communityId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> =>
  listPublishedActivitiesByDiscoverCommunityFromMongo({ communityId, window: 'upcoming', take });

/** Past published outings for a discoverable community. */
export const listPublishedPastActivitiesByDiscoverCommunityFromMongo = async (
  communityId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> =>
  listPublishedActivitiesByDiscoverCommunityFromMongo({ communityId, window: 'past', take });

/** Published past outings hosted or created by a member (public profile trip history). */
export const listPublishedPastActivitiesByMemberFromMongo = async (
  userId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> => {
  const now = new Date();
  const docs = await activitiesCollection()
    .find({
      status: ActivityStatus.PUBLISHED,
      startAt: { $lt: now },
      activityMode: { $ne: 'seeking' },
      $or: [{ hostId: userId }, { createdById: userId }],
    })
    .sort({ startAt: -1 })
    .limit(Math.max(take, 1) * 3)
    .toArray();

  const filtered = await filterPublishedDocs(docs, 'past');
  const visible = filtered.filter(
    (doc) => !shouldHideActivityFromExploreMap(doc.joinMode, doc.requirements)
  );
  return assembleEventsWithPublicRelations(visible.slice(0, take));
};

/** Upcoming public map activities tagged with a curated destination. */
export const listPublishedUpcomingActivitiesByDestinationFromMongo = async (
  destinationId: string,
  take: number
): Promise<ActivityWithPublicRelations[]> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const locationIds = await locationsCollection()
    .find({ destinationId, status: LocationStatus.ACTIVE })
    .project({ _id: 1 })
    .limit(500)
    .toArray();
  const locationIdList = locationIds.map((row) => row._id);

  const docs = await activitiesCollection()
    .find({
      status: ActivityStatus.PUBLISHED,
      startAt: { $gte: startOfToday },
      joinMode: { $ne: 'private' },
      activityMode: { $ne: 'seeking' },
      $or: [
        { locationId: { $in: locationIdList } },
        { destinationId },
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

/** Active catalog places linked to a curated destination (`place.destinationId`). */
export const listActiveCatalogPlacesByDestinationFromMongo = async (
  destinationId: string,
  take: number
): Promise<Location[]> => {
  const docs = await locationsCollection()
    .find({
      destinationId,
      status: LocationStatus.ACTIVE,
      $or: [{ registryListed: { $exists: false } }, { registryListed: { $ne: false } }],
    })
    .sort({ name: 1 })
    .limit(Math.max(take, 1))
    .toArray();

  return enrichLocationsWithHeavyReadsBatch(docs.map((doc) => mapMongoLocation(doc)));
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
  const participantAgg = await activityParticipantsCollection()
    .aggregate<{ _id: string; participants: MongoActivityParticipant[] }>([
      { $match: { activityId: { $in: eventIds } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$activityId',
          participants: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          participants: { $slice: ['$participants', EXPLORE_MAP_PARTICIPANT_CAP] },
        },
      },
    ])
    .toArray();
  const participantsByActivity = new Map<string, MongoActivityParticipant[]>(
    participantAgg.map((row) => [row._id, row.participants as MongoActivityParticipant[]])
  );
  const participantDocs = participantAgg.flatMap((row) => row.participants as MongoActivityParticipant[]);

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
  startAtGte?: Date;
  startAtLt?: Date;
  windowOutside?: boolean;
  upcomingFromToday?: boolean;
}): Promise<{ items: ActivityWithTenantRelations[]; total: number }> => {
  const filter: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.status) filter.status = input.status;

  const startOfToday = new Date(new Date().toDateString());
  const hasWindow =
    input.windowOutside ||
    input.startAtGte !== undefined ||
    input.startAtLt !== undefined ||
    input.upcomingFromToday;

  if (!hasWindow && input.startBefore) {
    filter.startAt = { $lt: input.startBefore };
  } else if (input.windowOutside && input.startAtGte && input.startAtLt) {
    const outside: Record<string, unknown>[] = [
      { startAt: { $lt: input.startAtGte } },
      { startAt: { $gte: input.startAtLt } },
    ];
    if (input.upcomingFromToday) {
      filter.$and = [
        { $or: outside },
        { startAt: { $gte: startOfToday } },
      ];
    } else {
      filter.$or = outside;
    }
  } else {
    const startAt: Record<string, Date> = {};
    let gte = input.startAtGte;
    if (input.upcomingFromToday) {
      gte = gte && gte > startOfToday ? gte : startOfToday;
    }
    if (gte) startAt.$gte = gte;
    if (input.startAtLt) startAt.$lt = input.startAtLt;
    if (Object.keys(startAt).length > 0) filter.startAt = startAt;
  }

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
  if (!tenant || tenant.status !== 'ACTIVE' || tenant.hiddenFromPublic) return null;

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
