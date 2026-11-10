import { randomUUID } from 'crypto';
import { TenantBusinessMode, UserRole } from '../domain/enums.js';
import type { MerchantProfile } from '../domain/types.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users-store.js';
import { findTenantMembershipContext, listActiveTenantMembershipsByUser } from './tenant-access.js';
import { ORG_SHOP_MANAGE_ROLES } from './org-permissions.js';
import { COLLECTIONS } from './collections.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { listTenantsByOwnerId, findTenantById, writeTenantToMongo, type TenantRecord } from './tenant-store.js';

type MongoStripeWebhookEvent = {
  _id: string;
  createdAt: Date;
};

type MongoMerchantProfile = {
  _id: string;
  adminIds: string[];
  tenantId?: string | null;
  shopName: string;
  description: string | null;
  logo: string | null;
  websiteUrl?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  allowInboundChat?: boolean;
  showContactPhone?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MerchantProfileUpdate = Partial<
  Pick<
    MerchantProfile,
    | 'shopName'
    | 'description'
    | 'logo'
    | 'contactEmail'
    | 'contactPhone'
    | 'latitude'
    | 'longitude'
    | 'region'
    | 'allowInboundChat'
    | 'showContactPhone'
  >
>;

const stripeWebhookEventsCollection = (): Collection<MongoStripeWebhookEvent> =>
  getMongoClient()!.db().collection<MongoStripeWebhookEvent>(COLLECTIONS.STRIPE_WEBHOOK_EVENTS);

const merchantProfilesCollection = (): Collection<MongoMerchantProfile> =>
  getMongoClient()!.db().collection<MongoMerchantProfile>(COLLECTIONS.MERCHANT_PROFILES);

const mapMongoMerchantProfile = (merchant: MongoMerchantProfile): MerchantProfile => ({
  id: merchant._id,
  adminIds: merchant.adminIds,
  tenantId: merchant.tenantId ?? null,
  shopName: merchant.shopName,
  description: merchant.description,
  logo: merchant.logo,
  websiteUrl: merchant.websiteUrl ?? null,
  contactEmail: merchant.contactEmail,
  contactPhone: merchant.contactPhone,
  latitude: merchant.latitude ?? null,
  longitude: merchant.longitude ?? null,
  region: merchant.region ?? null,
  allowInboundChat: merchant.allowInboundChat === true,
  showContactPhone: merchant.showContactPhone === true,
  createdAt: merchant.createdAt,
  updatedAt: merchant.updatedAt
});

export const publicMerchantContactPhone = (
  profile: Pick<MerchantProfile, 'contactPhone' | 'showContactPhone'>
): string | null => (profile.showContactPhone ? profile.contactPhone : null);

/** Shop contacts who opted in to public inbound DMs. */
export const listInboundChatEnabledShopAdminIds = async (userIds: string[]): Promise<Set<string>> => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Set();

  const merchants = await merchantProfilesCollection()
    .find({ adminIds: { $in: uniqueIds }, allowInboundChat: true }, { projection: { adminIds: 1 } })
    .toArray();

  const allowed = new Set<string>();
  const wanted = new Set(uniqueIds);
  for (const merchant of merchants) {
    for (const adminId of merchant.adminIds ?? []) {
      if (wanted.has(adminId)) allowed.add(adminId);
    }
  }
  return allowed;
};

export const listPublicMerchantsForMap = async () => {
  const merchants = await merchantProfilesCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return merchants.map(mapMongoMerchantProfile);
};

export const findMerchantPublicById = async (id: string) => {
  const merchant = await merchantProfilesCollection().findOne({ _id: id });
  if (!merchant) return null;

  const owner = merchant.adminIds?.[0] ? await findAuthUserById(merchant.adminIds[0]) : null;

  return {
    ...mapMongoMerchantProfile(merchant),
    contactPersonName: owner?.profile?.displayName ?? null,
    contactPersonAvatar: owner?.profile?.avatarUrl ?? null,
    contactPersonUserId: owner?._id ?? null,
  };
};

export const resolveMerchantOwnerDisplay = async (
  adminIds: string[] | null | undefined
): Promise<{ userId: string; name: string | null; avatarUrl: string | null } | null> => {
  if (!adminIds?.[0]) return null;
  const map = await loadMerchantOwnerDisplaysByAdminIds([adminIds]);
  const ownerId = adminIds[0];
  return map.get(ownerId) ?? null;
};

export const loadMerchantOwnerDisplaysByAdminIds = async (
  adminIdsList: string[][]
): Promise<Map<string, { userId: string; name: string | null; avatarUrl: string | null }>> => {
  const ownerIds = [...new Set(adminIdsList.map((ids) => ids?.[0]).filter(Boolean))] as string[];
  if (ownerIds.length === 0) return new Map();

  const owners = await findAuthUsersByIds(ownerIds);
  const ownersById = new Map(owners.map((owner) => [owner._id, owner]));
  const result = new Map<string, { userId: string; name: string | null; avatarUrl: string | null }>();

  for (const ownerId of ownerIds) {
    const owner = ownersById.get(ownerId);
    if (!owner) continue;
    result.set(ownerId, {
      userId: owner._id,
      name: owner.profile?.displayName ?? null,
      avatarUrl: owner.profile?.avatarUrl ?? null,
    });
  }

  return result;
};

export const findMerchantProfilesByTenantIds = async (
  tenantIds: (string | null | undefined)[]
): Promise<Map<string, MerchantProfile>> => {
  const uniqueIds = [...new Set(tenantIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map();

  const merchants = await merchantProfilesCollection()
    .find({ tenantId: { $in: uniqueIds } })
    .toArray();

  const byTenantId = new Map<string, MerchantProfile>();
  for (const merchant of merchants) {
    if (typeof merchant.tenantId === 'string' && !byTenantId.has(merchant.tenantId)) {
      byTenantId.set(merchant.tenantId, mapMongoMerchantProfile(merchant));
    }
  }
  return byTenantId;
};

/** Shop owners with an active shop tenant can manage their profile without MERCHANT_ADMIN role. */
export const userCanManageShopProfile = async (userId: string, role: UserRole): Promise<boolean> => {
  if (role === UserRole.PLATFORM_ADMIN || role === UserRole.MERCHANT_ADMIN) return true;
  return (await listManagedMerchantProfiles(userId)).length > 0;
};

export const userCanCreateShopProfile = async (userId: string, role: UserRole): Promise<boolean> => {
  if (role === UserRole.PLATFORM_ADMIN) return true;
  if (await findMerchantProfileByUserId(userId)) return false;
  const memberships = await listActiveTenantMembershipsByUser(userId);
  return memberships.some(
    (membership) =>
      membership.tenant.businessMode === TenantBusinessMode.SHOP &&
      ORG_SHOP_MANAGE_ROLES.includes(membership.role)
  );
};

export const findShopTenantForOwner = async (ownerId: string) => {
  const tenants = await listTenantsByOwnerId(ownerId);
  return tenants.find((tenant) => tenant.businessMode === TenantBusinessMode.SHOP) ?? null;
};

/** Set merchant_profiles.tenantId for a shop owner (idempotent). */
export const linkMerchantProfileToShopTenant = async (
  merchantId: string,
  ownerId: string,
  tenantId?: string | null
): Promise<string | null> => {
  const shopTenant =
    (tenantId ? await findTenantById(tenantId) : null) ?? (await findShopTenantForOwner(ownerId));
  if (!shopTenant || shopTenant.businessMode !== TenantBusinessMode.SHOP || shopTenant.ownerId !== ownerId) {
    return null;
  }

  await merchantProfilesCollection().updateOne(
    { _id: merchantId, adminIds: ownerId },
    { $set: { tenantId: shopTenant.id, updatedAt: new Date() } }
  );
  return shopTenant.id;
};

export const findMerchantProfileByTenantId = async (tenantId: string) => {
  const linked = await merchantProfilesCollection().findOne({ tenantId });
  if (linked) {
    return mapMongoMerchantProfile(linked);
  }

  const tenant = await findTenantById(tenantId);
  if (!tenant || tenant.businessMode !== TenantBusinessMode.SHOP) {
    return null;
  }
  return findMerchantProfileByUserId(tenant.ownerId);
};

export const findMerchantProfileByUserId = async (userId: string) => {
  const merchant = await merchantProfilesCollection().findOne(
    { adminIds: userId },
    { sort: { createdAt: 1 } }
  );
  return merchant ? mapMongoMerchantProfile(merchant) : null;
};

export const findMerchantProfilesByUserIds = async (userIds: (string | null | undefined)[]) => {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) {
    return new Map<string, ReturnType<typeof mapMongoMerchantProfile>>();
  }

  const merchants = await merchantProfilesCollection()
    .find({ adminIds: { $in: uniqueIds } })
    .sort({ createdAt: 1 })
    .toArray();

  const byUserId = new Map<string, ReturnType<typeof mapMongoMerchantProfile>>();
  for (const merchant of merchants) {
    const mapped = mapMongoMerchantProfile(merchant);
    for (const adminId of merchant.adminIds) {
      if (uniqueIds.includes(adminId) && !byUserId.has(adminId)) {
        byUserId.set(adminId, mapped);
      }
    }
  }
  return byUserId;
};

export const listManagedMerchantProfiles = async (adminId: string) => {
  const byAdmin = await merchantProfilesCollection().find({ adminIds: adminId }).sort({ createdAt: 1 }).toArray();
  const seen = new Set(byAdmin.map((merchant) => merchant._id));
  const results = byAdmin.map(mapMongoMerchantProfile);

  const memberships = await listActiveTenantMembershipsByUser(adminId);
  const shopTenantIds = memberships
    .filter(
      (membership) =>
        membership.tenant.businessMode === TenantBusinessMode.SHOP &&
        ORG_SHOP_MANAGE_ROLES.includes(membership.role)
    )
    .map((membership) => membership.tenantId);

  if (shopTenantIds.length > 0) {
    const linked = await merchantProfilesCollection()
      .find({ tenantId: { $in: shopTenantIds } })
      .sort({ createdAt: 1 })
      .toArray();
    for (const merchant of linked) {
      if (seen.has(merchant._id)) continue;
      seen.add(merchant._id);
      results.push(mapMongoMerchantProfile(merchant));
    }
  }

  return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const findManagedMerchantProfileById = async (adminId: string, merchantId: string) => {
  const merchant = await merchantProfilesCollection().findOne({ _id: merchantId });
  if (!merchant) return null;

  if (merchant.adminIds.includes(adminId)) {
    return mapMongoMerchantProfile(merchant);
  }

  if (merchant.tenantId) {
    const membership = await findTenantMembershipContext(merchant.tenantId, adminId);
    if (membership && ORG_SHOP_MANAGE_ROLES.includes(membership.role)) {
      return mapMongoMerchantProfile(merchant);
    }
  }

  return null;
};

export const createMerchantProfileForUser = async (
  userId: string,
  data: {
    shopName: string;
    description?: string;
    logo?: string;
    websiteUrl?: string | null;
    contactEmail?: string;
    contactPhone?: string;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
    allowInboundChat?: boolean;
    showContactPhone?: boolean;
  },
  options?: { tenantId?: string | null; linkShopTenant?: boolean }
) => {
  let tenantId: string | null = null;
  if (options && 'tenantId' in options) {
    tenantId = options.tenantId ?? null;
  } else if (options?.linkShopTenant !== false) {
    const shopTenant = await findShopTenantForOwner(userId);
    tenantId = shopTenant?.id ?? null;
  }

  const now = new Date();
  const doc: MongoMerchantProfile = {
    _id: randomUUID(),
    adminIds: [userId],
    ...(tenantId ? { tenantId } : {}),
    shopName: data.shopName,
    description: data.description ?? null,
    logo: data.logo ?? null,
    websiteUrl: data.websiteUrl ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    region: data.region ?? null,
    allowInboundChat: data.allowInboundChat === true,
    showContactPhone: data.showContactPhone === true,
    createdAt: now,
    updatedAt: now
  };
  await merchantProfilesCollection().insertOne(doc);
  const profile = mapMongoMerchantProfile(doc);
  if (tenantId) {
    await linkMerchantProfileToShopTenant(profile.id, userId, tenantId);
  }
  return profile;
};

export const updateManagedMerchantProfileById = async (
  adminId: string,
  merchantId: string,
  data: MerchantProfileUpdate
) => {
  const updatedAt = new Date();
  const result = await merchantProfilesCollection().findOneAndUpdate(
    { _id: merchantId, adminIds: adminId },
    { $set: { ...data, updatedAt } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Shop profile not found.');
  }
  return mapMongoMerchantProfile(result);
};

/** Keep shop tenant row aligned with the merchant profile the owner edits in organisation manage. */
export const syncShopTenantFromMerchantProfile = async (
  ownerId: string,
  profile: Pick<
    MerchantProfile,
    'id' | 'shopName' | 'description' | 'logo' | 'websiteUrl' | 'latitude' | 'longitude' | 'region' | 'tenantId'
  >
) => {
  const shopTenant =
    (profile.tenantId ? await findTenantById(profile.tenantId) : null) ??
    (await findShopTenantForOwner(ownerId));
  if (!shopTenant || shopTenant.businessMode !== TenantBusinessMode.SHOP || shopTenant.ownerId !== ownerId) {
    return null;
  }

  const updated = {
    ...shopTenant,
    name: profile.shopName,
    description: profile.description,
    website: profile.websiteUrl,
    logoUrl: profile.logo,
    region: profile.region,
    latitude: profile.latitude,
    longitude: profile.longitude,
    updatedAt: new Date(),
  };
  await writeTenantToMongo(updated);
  await linkMerchantProfileToShopTenant(profile.id, ownerId, shopTenant.id);
  return updated;
};

/** Dual-write: when a shop tenant is updated elsewhere, mirror fields onto merchant_profiles. */
export const syncMerchantProfileFromShopTenant = async (tenant: TenantRecord): Promise<MerchantProfile | null> => {
  if (tenant.businessMode !== TenantBusinessMode.SHOP) return null;

  const merchant = await merchantProfilesCollection().findOne({ tenantId: tenant.id });
  if (!merchant) return null;

  const patch = {
    shopName: tenant.name,
    description: tenant.description ?? null,
    logo: tenant.logoUrl ?? null,
    websiteUrl: tenant.website ?? null,
    region: tenant.region ?? null,
    latitude: tenant.latitude ?? null,
    longitude: tenant.longitude ?? null,
    updatedAt: new Date(),
  };

  const result = await merchantProfilesCollection().findOneAndUpdate(
    { _id: merchant._id },
    { $set: patch },
    { returnDocument: 'after' }
  );
  return result ? mapMongoMerchantProfile(result) : null;
};

export const hasProcessedStripeWebhookEvent = async (eventId: string): Promise<boolean> => {
  const mongoEvent = await stripeWebhookEventsCollection().findOne({ _id: eventId });
  return Boolean(mongoEvent);
};

export const recordStripeWebhookEvent = async (eventId: string): Promise<void> => {
  await stripeWebhookEventsCollection().updateOne(
    { _id: eventId },
    { $set: { createdAt: new Date() } },
    { upsert: true }
  );
};

export const deleteMerchantProfileByUser = async (userId: string): Promise<void> => {
  await merchantProfilesCollection().updateMany(
    { adminIds: userId },
    { $pull: { adminIds: userId }, $set: { updatedAt: new Date() } }
  );
  await merchantProfilesCollection().deleteMany({ adminIds: { $size: 0 } });
};

