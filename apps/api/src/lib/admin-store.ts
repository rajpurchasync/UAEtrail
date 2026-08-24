import type { Collection } from 'mongodb';
import type { Event, Location, Product, Tenant, TenantMembership } from '../domain/types.js';
import { EventStatus, ProductStatus, TenantStatus } from '../domain/enums.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users.js';
import { createLocationRecord } from './events-store.js';
import { newEntityId, type MongoEventDoc } from './entity-builders.js';
import { findLocationInMongo, writeEventDocToMongo, writeLocationToMongo } from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { findTenantById, isTenantSlugTaken as isTenantSlugTakenInStore } from './tenant-store.js';
import { syncTenantMembershipStatusForTenant } from './tenant-access.js';

type MongoAuditLog = {
  _id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  tenantId: string | null;
  metadata: unknown;
  createdAt: Date;
};

type MongoAdminMetricDoc = {
  _id?: string;
  status?: string;
  startAt?: Date;
  createdAt?: Date;
};

type MongoAdminLocationDoc = Omit<Location, 'id'> & { _id: string };
type MongoTenantDoc = Omit<Tenant, 'id'> & { _id: string };
type MongoProductDoc = Omit<Product, 'id'> & { _id: string };
type MongoMerchantProfileDoc = {
  _id: string;
  shopName: string;
};

type MongoTenantMembershipDoc = Omit<TenantMembership, 'id'> & {
  _id: string;
  tenant?: Tenant;
};

type MongoEventParticipantDoc = {
  _id: string;
  eventId: string;
  checkedInAt: Date | null;
};

export type AuditLogFilter = {
  action?: string | { contains?: string };
  entityType?: string;
};

export type ProductAdminFilter = {
  status?: ProductStatus;
  category?: string;
  discountPercent?: { gt: number };
};

type LocationUpdateData = Partial<Omit<Location, 'id' | 'createdAt'>>;

type AdminTenantDetailed = Tenant & {
  owner: {
    id: string;
    email: string;
    profile: { displayName: string | null } | null;
  };
  memberships: Array<
    TenantMembership & {
      user: {
        email: string;
        profile: { displayName: string | null } | null;
      };
    }
  >;
  events: Array<
    Event & {
      location: Location;
      participants: Array<{ id: string; checkedInAt: Date | null }>;
      guide: { profile: { displayName: string | null } | null } | null;
    }
  >;
};

const auditLogsCollection = (): Collection<MongoAuditLog> =>
  getMongoClient()!.db().collection<MongoAuditLog>('audit_logs');

const tenantsCollection = (): Collection<MongoTenantDoc> =>
  getMongoClient()!.db().collection<MongoTenantDoc>('tenants');

const eventsCollection = (): Collection<MongoEventDoc> =>
  getMongoClient()!.db().collection<MongoEventDoc>('events');

const locationsCollection = (): Collection<MongoAdminLocationDoc> =>
  getMongoClient()!.db().collection<MongoAdminLocationDoc>('locations');

const organizerApplicationsCollection = (): Collection<MongoAdminMetricDoc> =>
  getMongoClient()!.db().collection<MongoAdminMetricDoc>('organizer_applications');

const productsCollection = (): Collection<MongoProductDoc> =>
  getMongoClient()!.db().collection<MongoProductDoc>('products');

const merchantProfilesCollection = (): Collection<MongoMerchantProfileDoc> =>
  getMongoClient()!.db().collection<MongoMerchantProfileDoc>('merchant_profiles');

const tenantMembershipsCollection = (): Collection<MongoTenantMembershipDoc> =>
  getMongoClient()!.db().collection<MongoTenantMembershipDoc>('tenant_memberships');

const eventParticipantsCollection = (): Collection<MongoEventParticipantDoc> =>
  getMongoClient()!.db().collection<MongoEventParticipantDoc>('event_participants');

const mapMongoLocation = (doc: MongoAdminLocationDoc): Location => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

const mapMongoTenant = (doc: MongoTenantDoc): Tenant => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

const mapMongoEvent = (doc: MongoEventDoc): Event => ({
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

const mapMongoProduct = (doc: MongoProductDoc): Product => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

const toMongoAuditQuery = (where: AuditLogFilter): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  if (where.entityType && typeof where.entityType === 'string') {
    query.entityType = where.entityType;
  }
  if (where.action && typeof where.action === 'string') {
    query.action = where.action;
  } else if (where.action && typeof where.action === 'object' && 'contains' in where.action) {
    const contains = where.action.contains;
    if (contains) {
      query.action = { $regex: contains, $options: 'i' };
    }
  }
  return query;
};

const toMongoProductQuery = (where: ProductAdminFilter): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  if (where.status) query.status = where.status;
  if (where.category) query.category = where.category;
  if (where.discountPercent?.gt != null) {
    query.discountPercent = { $gt: where.discountPercent.gt };
  }
  return query;
};

const loadEventsWithRelations = async (eventDocs: MongoEventDoc[]) => {
  if (eventDocs.length === 0) return [];

  const [locationMap, tenantMap, participantDocs] = await Promise.all([
    loadLocationsByIds([...new Set(eventDocs.map((doc) => doc.locationId))]),
    loadTenantsByIds([...new Set(eventDocs.map((doc) => doc.tenantId))]),
    eventParticipantsCollection()
      .find({ eventId: { $in: eventDocs.map((doc) => doc._id) } }, { projection: { eventId: 1 } })
      .toArray()
  ]);

  const guideIds = [...new Set(eventDocs.map((doc) => doc.guideId).filter((guideId): guideId is string => Boolean(guideId)))];
  const guideUsers = await findAuthUsersByIds(guideIds);
  const guideMap = new Map(guideUsers.map((user) => [user._id, user]));
  const participantsByEvent = new Map<string, Array<{ id: string }>>();
  for (const participant of participantDocs) {
    const existing = participantsByEvent.get(participant.eventId) ?? [];
    existing.push({ id: participant._id });
    participantsByEvent.set(participant.eventId, existing);
  }

  return eventDocs.map((eventDoc) => {
    const guide = eventDoc.guideId ? guideMap.get(eventDoc.guideId) : null;
    const tenant = tenantMap.get(eventDoc.tenantId);
    const location = locationMap.get(eventDoc.locationId);
    if (!tenant || !location) {
      throw new Error('Failed to load event relations.');
    }

    return {
      ...mapMongoEvent(eventDoc),
      location,
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        countryCode: tenant.countryCode,
        ownerId: tenant.ownerId
      },
      guide: guide
        ? {
            profile: {
              displayName: guide.profile.displayName,
              avatarUrl: guide.profile.avatarUrl,
              bio: guide.profile.bio
            }
          }
        : null,
      participants: participantsByEvent.get(eventDoc._id) ?? []
    };
  });
};

const loadLocationsByIds = async (ids: string[]): Promise<Map<string, Location>> => {
  if (ids.length === 0) return new Map();
  const docs = await locationsCollection().find({ _id: { $in: ids } }).toArray();
  return new Map(docs.map((doc) => [doc._id, mapMongoLocation(doc)]));
};

const loadTenantsByIds = async (ids: string[]): Promise<Map<string, Tenant>> => {
  if (ids.length === 0) return new Map();
  const docs = await tenantsCollection().find({ _id: { $in: ids } }).toArray();
  return new Map(docs.map((doc) => [doc._id, mapMongoTenant(doc)]));
};

export const isTenantSlugTaken = isTenantSlugTakenInStore;

export const listAdminLocationsPaged = async (input: { skip: number; take: number }) => {
  const [items, total] = await Promise.all([
    locationsCollection()
      .find({})
      .sort({ createdAt: -1 })
      .skip(input.skip)
      .limit(input.take)
      .toArray(),
    locationsCollection().countDocuments({})
  ]);

  return {
    items: items.map(mapMongoLocation),
    total
  };
};

export const createAdminLocation = async (data: Parameters<typeof createLocationRecord>[0]) => {
  return createLocationRecord(data);
};

export const findAdminLocationById = async (id: string) => {
  return findLocationInMongo(id);
};

export const updateAdminLocation = async (id: string, data: LocationUpdateData) => {
  const existing = await findLocationInMongo(id);
  if (!existing) {
    throw new Error('Location not found.');
  }

  const updated: Location = {
    ...existing,
    ...data,
    updatedAt: new Date()
  };
  await writeLocationToMongo(updated);
  return updated;
};

export const deleteAdminLocation = async (id: string) => {
  const existing = await findLocationInMongo(id);
  if (!existing) {
    throw new Error('Location not found.');
  }
  await locationsCollection().deleteOne({ _id: id });
  return existing;
};

export const countActiveEventsByLocationId = async (locationId: string) => {
  return eventsCollection().countDocuments({
    locationId,
    status: { $in: [EventStatus.PUBLISHED, EventStatus.DRAFT] }
  });
};

export const findAdminTenantById = async (id: string) => {
  return findTenantById(id);
};

export const findAdminLocationByIdForEventCreate = findAdminLocationById;

export const createAdminPublishedEvent = async (input: {
  tenantId: string;
  locationId: string;
  createdById: string;
  title: string;
  description: string;
  startAt: Date;
  endAt?: Date;
  meetingPoint?: string;
  itinerary: string[];
  requirements: string[];
  priceAed: number;
  capacity: number;
  images: string[];
}) => {
  const now = new Date();
  const eventId = newEntityId();
  const doc: MongoEventDoc = {
    _id: eventId,
    tenantId: input.tenantId,
    locationId: input.locationId,
    createdById: input.createdById,
    guideId: null,
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    meetingPoint: input.meetingPoint ?? null,
    meetingLat: null,
    meetingLng: null,
    parkingPoint: null,
    parkingLat: null,
    parkingLng: null,
    meetingDifferent: false,
    carPoolEnabled: false,
    carPoolFree: null,
    carPoolPriceAed: null,
    carPoolDetails: null,
    paymentTerms: null,
    itinerary: input.itinerary,
    requirements: input.requirements,
    images: input.images,
    priceAed: input.priceAed,
    pricePackages: [],
    capacity: input.capacity,
    status: EventStatus.PUBLISHED,
    featured: false,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  };

  await writeEventDocToMongo(doc);

  const [location, tenant] = await Promise.all([
    findLocationInMongo(input.locationId),
    findTenantById(input.tenantId)
  ]);

  if (!location || !tenant) {
    throw new Error('Failed to load event relations.');
  }

  return {
    ...mapMongoEvent(doc),
    location,
    tenant
  };
};

export const listAdminModerationEventsPaged = async (input: { skip: number; take: number }) => {
  const [eventDocs, total] = await Promise.all([
    eventsCollection()
      .find({})
      .sort({ startAt: 1 })
      .skip(input.skip)
      .limit(input.take)
      .toArray(),
    eventsCollection().countDocuments({})
  ]);

  const items = await loadEventsWithRelations(eventDocs);
  return { items, total };
};

export const findAdminEventById = async (id: string) => {
  const doc = await eventsCollection().findOne({ _id: id });
  return doc ? mapMongoEvent(doc) : null;
};

export const findAdminEventDetailedById = async (id: string) => {
  const doc = await eventsCollection().findOne({ _id: id });
  if (!doc) return null;
  const [event] = await loadEventsWithRelations([doc]);
  return event ?? null;
};

export const updateAdminEventStatus = async (id: string, status: EventStatus) => {
  const result = await eventsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Event not found.');
  }
  return mapMongoEvent(result);
};

export const toggleAdminEventFeatured = async (id: string, featured: boolean) => {
  const result = await eventsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { featured, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Event not found.');
  }
  return mapMongoEvent(result);
};

export const countAdminMetrics = async (now: Date) => {
  const [tenantCount, eventCount, pendingApplications, totalLocations, activeTrips] = await Promise.all([
    tenantsCollection().countDocuments({ status: TenantStatus.ACTIVE }),
    eventsCollection().countDocuments({}),
    organizerApplicationsCollection().countDocuments({ status: 'PENDING' }),
    locationsCollection().countDocuments({}),
    eventsCollection().countDocuments({ status: EventStatus.PUBLISHED, startAt: { $gte: now } })
  ]);

  return { tenantCount, eventCount, pendingApplications, totalLocations, activeTrips };
};

export const listOwnerTenantTypes = async (ownerIds: string[]) => {
  const docs = await tenantsCollection()
    .find({ ownerId: { $in: ownerIds } }, { projection: { ownerId: 1, type: 1 } })
    .toArray();
  return docs.map((doc) => ({ ownerId: doc.ownerId, type: doc.type }));
};

export const listUserOwnedTenantsBasic = async (ownerId: string) => {
  const docs = await tenantsCollection()
    .find({ ownerId }, { projection: { name: 1, slug: 1, type: 1, status: 1 } })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    type: doc.type,
    status: doc.status
  }));
};

export const listTenantMembershipsForUser = async (userId: string) => {
  const memberships = await tenantMembershipsCollection().find({ userId }).toArray();
  const tenantIds = [...new Set(memberships.map((membership) => membership.tenantId))];
  const tenantMap = await loadTenantsByIds(tenantIds);

  return memberships.flatMap((membership) => {
    const tenant = tenantMap.get(membership.tenantId);
    if (!tenant) return [];
    return [
      {
        id: membership._id,
        tenantId: membership.tenantId,
        userId: membership.userId,
        role: membership.role,
        createdAt: membership.createdAt,
        tenant
      }
    ];
  });
};

export const listEventsForAdminRequests = async (eventIds: string[]) => {
  if (eventIds.length === 0) return [];

  const docs = await eventsCollection().find({ _id: { $in: eventIds } }).toArray();
  const locationMap = await loadLocationsByIds([...new Set(docs.map((doc) => doc.locationId))]);

  return docs.map((doc) => ({
    ...mapMongoEvent(doc),
    location: locationMap.get(doc.locationId)!
  }));
};

export const listEventsForAdminTrips = async (eventIds: string[]) => {
  if (eventIds.length === 0) return [];

  const docs = await eventsCollection().find({ _id: { $in: eventIds } }).toArray();
  const [locationMap, tenantMap] = await Promise.all([
    loadLocationsByIds([...new Set(docs.map((doc) => doc.locationId))]),
    loadTenantsByIds([...new Set(docs.map((doc) => doc.tenantId))])
  ]);

  return docs.map((doc) => ({
    ...mapMongoEvent(doc),
    location: locationMap.get(doc.locationId)!,
    tenant: tenantMap.get(doc.tenantId)!
  }));
};

export const listUserHostedEventsBasic = async (userId: string, limit = 20) => {
  const [ownedTenants, memberships] = await Promise.all([
    tenantsCollection().find({ ownerId: userId }, { projection: { _id: 1 } }).toArray(),
    tenantMembershipsCollection()
      .find({ userId, role: { $in: ['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_GUIDE'] } }, { projection: { tenantId: 1 } })
      .toArray()
  ]);

  const ownedTenantIds = new Set(ownedTenants.map((doc) => doc._id));
  const tenantIds = [...new Set([...ownedTenantIds, ...memberships.map((m) => m.tenantId)])];

  const orClauses: Record<string, unknown>[] = [{ guideId: userId }];
  if (tenantIds.length > 0) {
    orClauses.push({ tenantId: { $in: tenantIds } });
  }

  const docs = await eventsCollection()
    .find({ $or: orClauses })
    .sort({ startAt: -1 })
    .limit(limit)
    .toArray();

  const [locationMap, tenantMap] = await Promise.all([
    loadLocationsByIds([...new Set(docs.map((doc) => doc.locationId))]),
    loadTenantsByIds([...new Set(docs.map((doc) => doc.tenantId))])
  ]);

  return docs.map((doc) => {
    const tenant = tenantMap.get(doc.tenantId);
    const isOwner = ownedTenantIds.has(doc.tenantId);
    return {
      eventId: doc._id,
      tenantId: doc.tenantId,
      title: doc.title,
      status: doc.status.toLowerCase(),
      date: doc.startAt.toISOString().slice(0, 10),
      locationName: locationMap.get(doc.locationId)?.name ?? '',
      organizerName: tenant?.name ?? '',
      role: doc.guideId === userId ? 'guide' : isOwner ? 'owner' : 'staff'
    };
  });
};

export const listAdminTenantsPaged = async (input: { skip: number; take: number }) => {
  const [tenantDocs, total] = await Promise.all([
    tenantsCollection()
      .find({})
      .sort({ createdAt: -1 })
      .skip(input.skip)
      .limit(input.take)
      .toArray(),
    tenantsCollection().countDocuments({})
  ]);

  const items = tenantDocs.map(mapMongoTenant);
  const ownerIds = [...new Set(items.map((tenant) => tenant.ownerId))];
  const tenantIds = items.map((tenant) => tenant.id);
  const [owners, membershipCounts, eventCounts] = await Promise.all([
    findAuthUsersByIds(ownerIds),
    tenantMembershipsCollection()
      .aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } }
      ])
      .toArray(),
    eventsCollection()
      .aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } }
      ])
      .toArray()
  ]);

  const ownerMap = new Map(owners.map((owner) => [owner._id, owner]));
  const membershipCountMap = new Map(membershipCounts.map((row) => [row._id, row.count]));
  const eventCountMap = new Map(eventCounts.map((row) => [row._id, row.count]));

  return {
    items: items.map((tenant) => {
      const owner = ownerMap.get(tenant.ownerId);
      return {
        ...tenant,
        owner: {
          email: owner?.email ?? 'unknown@unknown',
          profile: { displayName: owner?.profile.displayName ?? null }
        },
        _count: {
          memberships: membershipCountMap.get(tenant.id) ?? 0,
          events: eventCountMap.get(tenant.id) ?? 0
        }
      };
    }),
    total
  };
};

export const findAdminTenantDetailedById = async (id: string): Promise<AdminTenantDetailed | null> => {
  const tenantDoc = await tenantsCollection().findOne({ _id: id });
  if (!tenantDoc) return null;

  const tenant = mapMongoTenant(tenantDoc);
  const [owner, memberships, eventDocs] = await Promise.all([
    findAuthUserById(tenant.ownerId),
    tenantMembershipsCollection().find({ tenantId: id }).toArray(),
    eventsCollection().find({ tenantId: id }).sort({ startAt: -1 }).toArray()
  ]);

  if (!owner) return null;

  const memberUserIds = memberships.map((membership) => membership.userId);
  const guideIds = [...new Set(eventDocs.map((event) => event.guideId).filter((guideId): guideId is string => Boolean(guideId)))];
  const [memberUsers, guideUsers, locationMap, participantDocs] = await Promise.all([
    findAuthUsersByIds(memberUserIds),
    findAuthUsersByIds(guideIds),
    loadLocationsByIds([...new Set(eventDocs.map((event) => event.locationId))]),
    eventParticipantsCollection()
      .find({ eventId: { $in: eventDocs.map((event) => event._id) } }, { projection: { eventId: 1, checkedInAt: 1 } })
      .toArray()
  ]);

  const memberUserMap = new Map(memberUsers.map((user) => [user._id, user]));
  const guideUserMap = new Map(guideUsers.map((user) => [user._id, user]));
  const participantsByEvent = new Map<string, Array<{ id: string; checkedInAt: Date | null }>>();
  for (const participant of participantDocs) {
    const existing = participantsByEvent.get(participant.eventId) ?? [];
    existing.push({ id: participant._id, checkedInAt: participant.checkedInAt });
    participantsByEvent.set(participant.eventId, existing);
  }

  return {
    ...tenant,
    owner: {
      id: owner._id,
      email: owner.email,
      profile: { displayName: owner.profile.displayName }
    },
    memberships: memberships.map((membership) => {
      const user = memberUserMap.get(membership.userId);
      return {
        id: membership._id,
        tenantId: membership.tenantId,
        userId: membership.userId,
        role: membership.role,
        createdAt: membership.createdAt,
        user: {
          email: user?.email ?? 'unknown@unknown',
          profile: { displayName: user?.profile.displayName ?? null }
        }
      };
    }),
    events: eventDocs.map((eventDoc) => {
      const guide = eventDoc.guideId ? guideUserMap.get(eventDoc.guideId) : null;
      return {
        ...mapMongoEvent(eventDoc),
        location: locationMap.get(eventDoc.locationId)!,
        participants: participantsByEvent.get(eventDoc._id) ?? [],
        guide: guide
          ? { profile: { displayName: guide.profile.displayName } }
          : null
      };
    })
  };
};

export const updateAdminTenantStatus = async (id: string, status: TenantStatus) => {
  const result = await tenantsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Tenant not found.');
  }
  await syncTenantMembershipStatusForTenant(id, status);
  return mapMongoTenant(result);
};

export const listAuditLogsPaged = async (input: {
  where: AuditLogFilter;
  skip: number;
  take: number;
}) => {
  const query = toMongoAuditQuery(input.where);
  const [docs, total] = await Promise.all([
    auditLogsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    auditLogsCollection().countDocuments(query)
  ]);

  const actorIds = [...new Set(docs.map((doc) => doc.actorId))];
  const actors = await findAuthUsersByIds(actorIds);
  const actorMap = new Map(actors.map((actor) => [actor._id, actor]));

  const items = docs.map((doc) => {
    const actor = actorMap.get(doc.actorId);
    return {
      id: doc._id,
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      tenantId: doc.tenantId,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      actor: {
        email: actor?.email ?? 'unknown@unknown',
        profile: {
          displayName: actor?.profile.displayName ?? null
        }
      }
    };
  });

  return { items, total };
};

export const listBroadcastNotificationAuditLogs = async (take: number) => {
  const docs = await auditLogsCollection()
    .find({ action: 'notification.broadcast' })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();

  const actorIds = [...new Set(docs.map((doc) => doc.actorId))];
  const actors = await findAuthUsersByIds(actorIds);
  const actorMap = new Map(actors.map((actor) => [actor._id, actor]));

  return docs.map((doc) => {
    const actor = actorMap.get(doc.actorId);
    return {
      id: doc._id,
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      tenantId: doc.tenantId,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      actor: {
        email: actor?.email ?? 'unknown@unknown',
        profile: {
          displayName: actor?.profile.displayName ?? null
        }
      }
    };
  });
};

export const listAdminProductsPaged = async (input: {
  where: ProductAdminFilter;
  skip: number;
  take: number;
}) => {
  const query = toMongoProductQuery(input.where);
  const [productDocs, total] = await Promise.all([
    productsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    productsCollection().countDocuments(query)
  ]);

  const merchantIds = [...new Set(productDocs.map((product) => product.merchantId))];
  const merchants = await merchantProfilesCollection().find({ _id: { $in: merchantIds } }).toArray();
  const merchantMap = new Map(merchants.map((merchant) => [merchant._id, merchant]));

  const items = productDocs.map((productDoc) => ({
    ...mapMongoProduct(productDoc),
    merchant: {
      id: productDoc.merchantId,
      shopName: merchantMap.get(productDoc.merchantId)?.shopName ?? 'Unknown merchant'
    }
  }));

  return { items, total };
};

export const findAdminProductById = async (id: string) => {
  const doc = await productsCollection().findOne({ _id: id });
  return doc ? mapMongoProduct(doc) : null;
};

export const updateAdminProductStatus = async (id: string, status: ProductStatus) => {
  const result = await productsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Product not found.');
  }
  return mapMongoProduct(result);
};
