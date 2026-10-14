import type { Collection } from 'mongodb';
import type { Location } from '../domain/types.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { resolveParticipationMode } from '../domain/activity-participation-mode.js';
import { ActivityStatus, ActivityType, LocationStatus } from '../domain/enums.js';
import {
  buildActivityFromCreateInput,
  buildLocationFromCreateInput,
  newEntityId,
  type ActivityCreateInput,
  type ActivityUpdateInput,
  type MongoActivityDoc
} from './entity-builders.js';
import { invalidateExploreMapCache } from './explore-map-cache.js';
import {
  GROUP_REGION_LEVEL,
  readGroupRegionAtLevel,
  sameGroupRegionLevels,
} from '@uaetrail/shared-types';
import {
  resolveGroupRegionLevelsForActivityDoc,
  stampLocationGroupRegionLevels,
} from './group-region-resolution.js';
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
  listPublishedUpcomingActivitiesByMemberFromMongo,
  listPublishedUpcomingActivitiesByAreaFromMongo,
  listActiveCatalogPlacesByAreaFromMongo,
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
  return { id: _id, ...rest, areaLabel: rest.areaLabel ?? null };
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
  const linkedLocation = mongoDoc.locationId ? await findLocationInMongo(mongoDoc.locationId) : null;
  const groupRegionLevels = await resolveGroupRegionLevelsForActivityDoc(mongoDoc, linkedLocation);
  mongoDoc.groupRegionLevels = groupRegionLevels;
  await writeActivityDocToMongo(mongoDoc, {
    countryCode: linkedLocation?.countryCode ?? 'AE',
    location: linkedLocation,
  });

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
  if (data.rideshareEnabled !== undefined) patch.rideshareEnabled = data.rideshareEnabled;
  if (data.rideshareFree !== undefined) patch.rideshareFree = data.rideshareFree;
  if (data.ridesharePriceAed !== undefined) patch.ridesharePriceAed = data.ridesharePriceAed;
  if (data.rideshareSeats !== undefined) patch.rideshareSeats = data.rideshareSeats;
  if (data.rideshareDetails !== undefined) patch.rideshareDetails = data.rideshareDetails;
  if (data.paymentTerms !== undefined) patch.paymentTerms = data.paymentTerms;
  if (data.pricingMode !== undefined) patch.pricingMode = data.pricingMode;
  if (data.itinerary !== undefined) patch.itinerary = data.itinerary;
  if (data.requirements !== undefined) patch.requirements = data.requirements;
  if (data.joinMode !== undefined) patch.joinMode = data.joinMode;
  if (data.participationMode !== undefined) patch.participationMode = data.participationMode;
  if (data.images !== undefined) patch.images = data.images;
  if (data.bannerUrl !== undefined) patch.bannerUrl = data.bannerUrl?.trim() || null;
  if (data.signupUrl !== undefined) patch.signupUrl = data.signupUrl?.trim() || null;
  if (data.pricePackages !== undefined) patch.pricePackages = data.pricePackages;
  if (data.linkedActivityId !== undefined) patch.linkedActivityId = data.linkedActivityId;
  if (data.linkedRideshareActivityId !== undefined) patch.linkedRideshareActivityId = data.linkedRideshareActivityId;
  if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;
  if (data.outingCategory !== undefined) patch.outingCategory = data.outingCategory;
  if (data.outingTopic !== undefined) patch.outingTopic = data.outingTopic;
  if (data.groupChatPostPolicy !== undefined) patch.groupChatPostPolicy = data.groupChatPostPolicy;
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

  const meetingCoordsTouched =
    data.meetingLat !== undefined ||
    data.meetingLng !== undefined ||
    data.startLat !== undefined ||
    data.startLng !== undefined ||
    data.parkingLat !== undefined ||
    data.parkingLng !== undefined;
  if (meetingCoordsTouched) {
    const linked = existing.locationId ? await findLocationInMongo(existing.locationId) : null;
    const groupRegionLevels = await resolveGroupRegionLevelsForActivityDoc(existing, linked);
    if (!sameGroupRegionLevels(groupRegionLevels, existing.groupRegionLevels)) {
      await patchActivityInMongo(
        activityId,
        { groupRegionLevels },
        {
          countryCode: linked?.countryCode ?? 'AE',
          location: linked,
        }
      );
    }
  }

  if (existing.status === ActivityStatus.PUBLISHED) {
    await invalidateExploreMapCache();
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
  const existing = await findActivityDocInMongo(activityId);
  await patchActivityInMongo(activityId, { status: ActivityStatus.CANCELLED });
  const mongoDoc = existing ?? (await findActivityDocInMongo(activityId));
  if (!mongoDoc) {
    throw new Error('Failed to cancel event.');
  }
  if (existing?.status === ActivityStatus.PUBLISHED) {
    await invalidateExploreMapCache();
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
    rideshareEnabled: source.rideshareEnabled ?? false,
    rideshareFree: source.rideshareEnabled ? (source.rideshareFree ?? true) : null,
    ridesharePriceAed:
      source.rideshareEnabled && source.rideshareFree === false ? source.ridesharePriceAed ?? 0 : null,
    rideshareSeats: source.rideshareEnabled ? source.rideshareSeats ?? null : null,
    rideshareDetails: source.rideshareEnabled ? source.rideshareDetails ?? undefined : undefined,
    paymentTerms: source.paymentTerms ?? undefined,
    itinerary: source.itinerary ?? [],
    requirements: source.requirements ?? [],
    joinMode: resolveJoinMode(source.joinMode, source.requirements),
    participationMode: resolveParticipationMode(source.participationMode, source.requirements),
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
  const draftDoc = await findActivityDocInMongo(activityId);
  const publishLocation =
    draftDoc?.locationId ? await findLocationInMongo(draftDoc.locationId) : null;
  const { resolveAreaIdForActivityPublish } = await import('./area-resolution.js');
  const { resolveJoinMode } = await import('../domain/activity-join-mode.js');
  const areaId =
    draftDoc && (await resolveAreaIdForActivityPublish(draftDoc, publishLocation));
  const joinMode = draftDoc
    ? resolveJoinMode(draftDoc.joinMode, draftDoc.requirements)
    : 'open';
  if (joinMode !== 'private' && !areaId) {
    const { ApiError } = await import('./api-error.js');
    throw new ApiError(
      400,
      'activity_area_required',
      'Set a meeting pin inside a curated UAE outdoor area, or link a place that already has an area, before publishing to the explore map.'
    );
  }
  const publishGroupRegionLevels =
    draftDoc && publishLocation
      ? await resolveGroupRegionLevelsForActivityDoc(draftDoc, publishLocation)
      : null;
  if (
    publishLocation &&
    !readGroupRegionAtLevel(publishLocation.groupRegionLevels, GROUP_REGION_LEVEL.state)?.trim()
  ) {
    const stampedLocation = await stampLocationGroupRegionLevels(publishLocation);
    if (readGroupRegionAtLevel(stampedLocation.groupRegionLevels, GROUP_REGION_LEVEL.state)?.trim()) {
      await writeLocationToMongo(stampedLocation);
    }
  }
  await patchActivityInMongo(
    activityId,
    {
      status: ActivityStatus.PUBLISHED,
      publishedAt,
      ...(areaId && !draftDoc?.areaId?.trim() ? { areaId } : {}),
      ...(publishGroupRegionLevels ? { groupRegionLevels: publishGroupRegionLevels } : {}),
    },
    {
      countryCode: publishLocation?.countryCode ?? 'AE',
      location: publishLocation,
    }
  );
  const mongoDoc = await findActivityDocInMongo(activityId);
  if (!mongoDoc) {
    throw new Error('Failed to publish event.');
  }
  await invalidateExploreMapCache();
  const actorUserId = mongoDoc.hostId ?? mongoDoc.createdById;
  const { notifyMemberPublishSubscribers } = await import('../services/member-publish-notifications.js');
  void notifyMemberPublishSubscribers(actorUserId, {
    publishType: 'activity',
    activityId,
    title: mongoDoc.title,
  });
  const location = mongoDoc.locationId ? await findLocationById(mongoDoc.locationId) : null;
  const { findTenantById } = await import('./tenant-store.js');
  const tenant = mongoDoc.tenantId ? await findTenantById(mongoDoc.tenantId) : null;
  const { notifyEntityFollowersOnActivityPublished } = await import(
    '../services/entity-publish-notifications.js'
  );
  void notifyEntityFollowersOnActivityPublished({
    activityId,
    title: mongoDoc.title,
    hostUserId: actorUserId,
    locationId: mongoDoc.locationId ?? null,
    tenantId: mongoDoc.tenantId ?? null,
    locationName: location?.name ?? null,
    tenantName: tenant?.name ?? null,
  });
  if (areaId && mongoDoc.activityMode !== 'seeking') {
    const { notifySeekersOfHostedActivityInArea } = await import('../services/seeking-area-match-notifications.js');
    void notifySeekersOfHostedActivityInArea({
      activityId,
      hostUserId: actorUserId,
      areaId,
      activityTitle: mongoDoc.title,
      activityStartAt: mongoDoc.startAt ?? publishedAt,
    });
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
  const location = await stampLocationGroupRegionLevels(buildLocationFromCreateInput(data, locationId));
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

/** Active venues for everyone; draft venues for submitter or platform admin (pending preview). */
export const findLocationForDetailView = async (
  locationId: string,
  viewerUserId?: string | null,
  viewerRole?: string | null
) => {
  const active = await findActiveLocationById(locationId);
  if (active) return active;

  const item = await findLocationInMongo(locationId);
  if (!item || item.status !== LocationStatus.DRAFT) return null;

  const isAdmin = viewerRole === 'ADMIN' || viewerRole === 'PLATFORM_ADMIN';
  if (viewerUserId && (item.submittedById === viewerUserId || isAdmin)) {
    return item;
  }
  return null;
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

export const listPublishedUpcomingActivitiesByMember = async (userId: string, take = 8) =>
  listPublishedUpcomingActivitiesByMemberFromMongo(userId, take);

export const listPublishedUpcomingActivitiesByArea = async (areaId: string, take = 8) =>
  listPublishedUpcomingActivitiesByAreaFromMongo(areaId, take);

export const listActiveCatalogPlacesByArea = async (areaId: string, take = 12) =>
  listActiveCatalogPlacesByAreaFromMongo(areaId, take);

export const findActivityTitlesByIds = async (activityIds: string[]): Promise<Map<string, string>> => {
  const unique = [...new Set(activityIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await activitiesCollection()
    .find({ _id: { $in: unique } })
    .project({ title: 1 })
    .toArray();
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row._id, row.title?.trim() || 'Outing');
  }
  return map;
};

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

export const listHostedActivityIdsForUser = async (userId: string, limit = 150): Promise<string[]> => {
  const rows = await activitiesCollection()
    .find({ $or: [{ hostId: userId }, { createdById: userId }] })
    .project({ _id: 1 })
    .sort({ startAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map((row) => row._id);
};

export const findActivityForRequestViewById = async (activityId: string) => {
  const [event] = await listActivitiesByIdsFromMongo([activityId]);
  return event ?? null;
};

export const findLinkedRideshareDocByParentId = async (parentActivityId: string): Promise<MongoActivityDoc | null> =>
  activitiesCollection().findOne({
    linkedActivityId: parentActivityId,
    activityType: ActivityType.RIDESHARE,
    status: { $ne: ActivityStatus.CANCELLED },
  });
