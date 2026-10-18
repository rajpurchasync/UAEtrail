import { randomUUID } from 'crypto';
import { OrderStatus, ProductStatus, TenantBusinessMode, UserRole } from '../domain/enums.js';
import type { MerchantProfile, Product, ProductClick, ShopOrder } from '../domain/types.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users-store.js';
import { findTenantMembershipContext, listActiveTenantMembershipsByUser } from './tenant-access.js';
import { ORG_SHOP_MANAGE_ROLES } from './org-permissions.js';
import { COLLECTIONS } from './collections.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { listTenantsByOwnerId, findTenantById, writeTenantToMongo, type TenantRecord } from './tenant-store.js';
import { normalizeSearchRegexInput } from './regex-search.js';

type MongoStripeWebhookEvent = {
  _id: string;
  createdAt: Date;
};

type MongoShopOrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPriceAed: number;
  totalAed: number;
  status: OrderStatus;
  fulfillmentTrackingLink: string | null;
  timestamp: Date;
};

type MongoShopOrder = {
  _id: string;
  userId: string;
  status: OrderStatus;
  totalAed: number;
  stripeSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: MongoShopOrderItem[];
};

type LegacyMongoShopOrderItem = {
  id?: string;
  productId: string;
  quantity: number;
  unitPriceAed?: number;
  totalAed?: number;
  status?: OrderStatus;
  fulfillmentTrackingLink?: string | null;
  timestamp?: Date;
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
  createdAt: Date;
  updatedAt: Date;
};

type MongoProduct = {
  _id: string;
  merchantId: string;
  name: string;
  description: string | null;
  images: string[];
  priceAed: number;
  stockQuantity: number;
  lowStockThreshold: number;
  discountPercent: number | null;
  externalUrl: string | null;
  packagingInfo: string | null;
  category: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

type MongoProductClick = Omit<ProductClick, 'id'> & {
  _id: string;
};

type MongoOrderLineItem = {
  _id: string;
  orderId?: string;
  productId: string;
  quantity: number;
  totalAed: number;
  status?: OrderStatus;
  fulfillmentTrackingLink?: string | null;
  timestamp: Date;
};

type MerchantProfileUpdate = Partial<
  Pick<
    MerchantProfile,
    'shopName' | 'description' | 'logo' | 'contactEmail' | 'contactPhone' | 'latitude' | 'longitude' | 'region'
  >
>;

type ProductUpdate = Partial<Omit<Product, 'id' | 'merchantId' | 'createdAt'>>;

const stripeWebhookEventsCollection = (): Collection<MongoStripeWebhookEvent> =>
  getMongoClient()!.db().collection<MongoStripeWebhookEvent>('stripe_webhook_events');

const shopOrdersCollection = (): Collection<MongoShopOrder> =>
  getMongoClient()!.db().collection<MongoShopOrder>(COLLECTIONS.SHOP_ORDERS);

const merchantProfilesCollection = (): Collection<MongoMerchantProfile> =>
  getMongoClient()!.db().collection<MongoMerchantProfile>(COLLECTIONS.MERCHANT_PROFILES);

const productsCollection = (): Collection<MongoProduct> =>
  getMongoClient()!.db().collection<MongoProduct>(COLLECTIONS.PRODUCTS);

const productClicksCollection = (): Collection<MongoProductClick> =>
  getMongoClient()!.db().collection<MongoProductClick>(COLLECTIONS.PRODUCT_CLICKS);

/** @deprecated Phase 4 — fulfillment reads/writes use embedded shop_orders.items. Kept for one-time migration reads. */
const _orderLineItemsCollection = (): Collection<MongoOrderLineItem> =>
  getMongoClient()!.db().collection<MongoOrderLineItem>(COLLECTIONS.ORDER_LINE_ITEMS);

const mapMongoProduct = (item: MongoProduct): Product => ({
  id: item._id,
  merchantId: item.merchantId,
  name: item.name,
  description: item.description,
  images: item.images,
  priceAed: item.priceAed,
  stockQuantity: item.stockQuantity ?? 0,
  lowStockThreshold: item.lowStockThreshold ?? 5,
  discountPercent: item.discountPercent,
  externalUrl: item.externalUrl,
  packagingInfo: item.packagingInfo,
  category: item.category,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const normalizeOrderLineItemStatus = (status?: OrderStatus) => {
  if (status === OrderStatus.PAID || status === OrderStatus.REFUNDED || !status) {
    return OrderStatus.DELIVERED;
  }
  return status;
};

const normalizeEmbeddedOrderItem = (
  orderId: string,
  raw: LegacyMongoShopOrderItem,
  index: number,
  fallbackTimestamp: Date
): MongoShopOrderItem => {
  const unitPriceAed = raw.unitPriceAed ?? (raw.totalAed != null && raw.quantity > 0 ? raw.totalAed / raw.quantity : 0);
  const totalAed = raw.totalAed ?? unitPriceAed * raw.quantity;
  return {
    id: raw.id ?? `${orderId}:${index}`,
    productId: raw.productId,
    quantity: raw.quantity,
    unitPriceAed,
    totalAed,
    status: raw.status ?? OrderStatus.PENDING,
    fulfillmentTrackingLink: raw.fulfillmentTrackingLink ?? null,
    timestamp: raw.timestamp ?? fallbackTimestamp,
  };
};

const mapEmbeddedLineItemForMerchant = (
  orderId: string,
  item: MongoShopOrderItem,
  product: MongoProduct
) => ({
  id: item.id,
  orderId,
  productId: item.productId,
  quantity: item.quantity,
  totalAed: item.totalAed,
  status: normalizeOrderLineItemStatus(item.status),
  fulfillmentTrackingLink: item.fulfillmentTrackingLink ?? null,
  timestamp: item.timestamp,
  product: {
    id: product._id,
    name: product.name,
    images: product.images,
    priceAed: product.priceAed,
    merchantId: product.merchantId,
    stockQuantity: product.stockQuantity ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 5,
  },
});

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
  createdAt: merchant.createdAt,
  updatedAt: merchant.updatedAt
});

export type MerchantAnalyticsInterval = 'day' | 'month' | 'year';

export type MerchantAnalyticsPoint = {
  bucket: string;
  salesAed: number;
  clicks: number;
  orderCount: number;
  quantitySold: number;
};

const analyticsBucketFormats: Record<MerchantAnalyticsInterval, string> = {
  day: '%Y-%m-%d',
  month: '%Y-%m',
  year: '%Y'
};

const buildAnalyticsBucketExpression = (interval: MerchantAnalyticsInterval) => ({
  $dateToString: {
    format: analyticsBucketFormats[interval],
    date: '$timestamp',
    timezone: 'UTC'
  }
});

const truncateAnalyticsDate = (date: Date, interval: MerchantAnalyticsInterval) => {
  if (interval === 'year') {
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  }
  if (interval === 'month') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
};

const advanceAnalyticsDate = (date: Date, interval: MerchantAnalyticsInterval) => {
  const next = new Date(date);
  if (interval === 'year') {
    next.setUTCFullYear(next.getUTCFullYear() + 1, 0, 1);
    return next;
  }
  if (interval === 'month') {
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    return next;
  }
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
};

const formatAnalyticsBucket = (date: Date, interval: MerchantAnalyticsInterval) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  if (interval === 'year') return String(year);
  if (interval === 'month') return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const buildEmptyAnalyticsPoints = (startDate: Date, endDate: Date, interval: MerchantAnalyticsInterval) => {
  const points: MerchantAnalyticsPoint[] = [];
  for (
    let cursor = truncateAnalyticsDate(startDate, interval);
    cursor <= endDate;
    cursor = advanceAnalyticsDate(cursor, interval)
  ) {
    points.push({
      bucket: formatAnalyticsBucket(cursor, interval),
      salesAed: 0,
      clicks: 0,
      orderCount: 0,
      quantitySold: 0
    });
  }
  return points;
};

export const listPublicProducts = async (input: {
  category?: string;
  search?: string;
  skip: number;
  take: number;
}) => {
  const searchRegex = normalizeSearchRegexInput(input.search);
  const query: Record<string, unknown> = {
    status: ProductStatus.ACTIVE,
    ...(input.category ? { category: input.category } : {}),
    ...(searchRegex ? { name: { $regex: searchRegex, $options: 'i' } } : {}),
  };

  const [items, total] = await Promise.all([
    productsCollection().find(query).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    productsCollection().countDocuments(query)
  ]);

  const merchantIds = [...new Set(items.map((item) => item.merchantId))];
  const merchants = await merchantProfilesCollection().find({ _id: { $in: merchantIds } }).toArray();
  const merchantMap = new Map(merchants.map((merchant) => [merchant._id, merchant]));

  return {
    total,
    items: items
      .map((item) => {
        const merchant = merchantMap.get(item.merchantId);
        if (!merchant) return null;
        return {
          id: item._id,
          name: item.name,
          description: item.description,
          images: item.images,
          priceAed: item.priceAed,
          stockQuantity: item.stockQuantity ?? 0,
          lowStockThreshold: item.lowStockThreshold ?? 5,
          discountPercent: item.discountPercent,
          externalUrl: item.externalUrl,
          packagingInfo: item.packagingInfo,
          category: item.category,
          status: item.status,
          merchant: {
            id: merchant._id,
            shopName: merchant.shopName,
            latitude: merchant.latitude ?? null,
            longitude: merchant.longitude ?? null,
            region: merchant.region ?? null
          }
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  };
};

export const listPublicMerchantsForMap = async () => {
  const merchants = await merchantProfilesCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return merchants.map(mapMongoMerchantProfile);
};

export const findActiveProductById = async (id: string) => {
  const product = await productsCollection().findOne({ _id: id, status: ProductStatus.ACTIVE });
  if (!product) return null;

  const merchant = await merchantProfilesCollection().findOne({ _id: product.merchantId });
  if (!merchant) return null;

  return {
    ...mapMongoProduct(product),
    merchant: {
      id: merchant._id,
      shopName: merchant.shopName,
      description: merchant.description,
      logo: merchant.logo,
      latitude: merchant.latitude ?? null,
      longitude: merchant.longitude ?? null,
      region: merchant.region ?? null
    }
  };
};

export const findMerchantPublicById = async (id: string) => {
  const merchant = await merchantProfilesCollection().findOne({ _id: id });
  if (!merchant) return null;

  const products = await productsCollection()
    .find({ merchantId: id, status: ProductStatus.ACTIVE })
    .sort({ createdAt: -1 })
    .toArray();

  const owner = merchant.adminIds?.[0] ? await findAuthUserById(merchant.adminIds[0]) : null;

  return {
    ...mapMongoMerchantProfile(merchant),
    contactPersonName: owner?.profile?.displayName ?? null,
    contactPersonAvatar: owner?.profile?.avatarUrl ?? null,
    contactPersonUserId: owner?._id ?? null,
    products: products.map(mapMongoProduct)
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

export const listActiveProductsByIds = async (productIds: string[]) => {
  if (productIds.length === 0) return [];

  const items = await productsCollection()
    .find({ _id: { $in: productIds }, status: ProductStatus.ACTIVE })
    .toArray();
  return items.map(mapMongoProduct);
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

/** Shop owners with an active shop tenant can manage commerce without MERCHANT_ADMIN role. */
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

export const listMerchantProducts = async (input: {
  merchantId: string;
  skip: number;
  take: number;
}) => {
  const where = { merchantId: input.merchantId };
  const [items, total] = await Promise.all([
    productsCollection().find(where).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    productsCollection().countDocuments(where)
  ]);

  return {
    items: items.map(mapMongoProduct),
    total
  };
};

export const createMerchantProduct = async (input: {
  merchantId: string;
  name: string;
  description?: string;
  images: string[];
  priceAed: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  discountPercent?: number;
  externalUrl?: string | null;
  packagingInfo?: string;
  category: string;
  status: ProductStatus;
}) => {
  const now = new Date();
  const doc: MongoProduct = {
    _id: randomUUID(),
    merchantId: input.merchantId,
    name: input.name,
    description: input.description ?? null,
    images: input.images,
    priceAed: input.priceAed,
    stockQuantity: input.stockQuantity ?? 0,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    discountPercent: input.discountPercent ?? null,
    externalUrl: input.externalUrl ?? null,
    packagingInfo: input.packagingInfo ?? null,
    category: input.category,
    status: input.status,
    createdAt: now,
    updatedAt: now
  };
  await productsCollection().insertOne(doc);
  return mapMongoProduct(doc);
};

export const findMerchantProductById = async (id: string, merchantId?: string) => {
  const item = await productsCollection().findOne(merchantId ? { _id: id, merchantId } : { _id: id });
  return item ? mapMongoProduct(item) : null;
};

export const updateMerchantProductById = async (id: string, data: ProductUpdate) => {
  const result = await productsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Product not found.');
  }
  return mapMongoProduct(result);
};

export const deactivateMerchantProductById = async (id: string) => {
  return updateMerchantProductById(id, { status: ProductStatus.INACTIVE });
};

export const createShopOrderWithItems = async (input: {
  userId: string;
  totalAed: number;
  items: Array<{ productId: string; quantity: number; unitPriceAed: number }>;
}) => {
  const now = new Date();
  const doc: MongoShopOrder = {
    _id: randomUUID(),
    userId: input.userId,
    totalAed: input.totalAed,
    status: OrderStatus.PENDING,
    stripeSessionId: null,
    createdAt: now,
    updatedAt: now,
    items: input.items.map((item) => ({
      id: randomUUID(),
      productId: item.productId,
      quantity: item.quantity,
      unitPriceAed: item.unitPriceAed,
      totalAed: item.quantity * item.unitPriceAed,
      status: OrderStatus.PENDING,
      fulfillmentTrackingLink: null,
      timestamp: now,
    })),
  };
  await shopOrdersCollection().insertOne(doc);
  return {
    id: doc._id,
    userId: doc.userId,
    status: doc.status,
    totalAed: doc.totalAed,
    stripeSessionId: doc.stripeSessionId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  } satisfies ShopOrder;
};

export const setShopOrderStripeSession = async (orderId: string, stripeSessionId: string) => {
  const result = await shopOrdersCollection().findOneAndUpdate(
    { _id: orderId },
    { $set: { stripeSessionId, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw new Error('Shop order not found.');
  }
  return {
    id: result._id,
    userId: result.userId,
    status: result.status,
    totalAed: result.totalAed,
    stripeSessionId: result.stripeSessionId,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  } satisfies ShopOrder;
};

export const findShopOrderById = async (id: string) => {
  const mongoOrder = await shopOrdersCollection().findOne({ _id: id });
  if (!mongoOrder) return null;

  return {
    id: mongoOrder._id,
    userId: mongoOrder.userId,
    status: mongoOrder.status,
    totalAed: mongoOrder.totalAed,
    stripeSessionId: mongoOrder.stripeSessionId,
    createdAt: mongoOrder.createdAt,
    updatedAt: mongoOrder.updatedAt
  } satisfies ShopOrder;
};

export const markShopOrderPaid = async (id: string) => {
  const existing = await shopOrdersCollection().findOne({ _id: id });
  if (!existing) {
    throw new Error('Shop order not found.');
  }

  const isAlreadyPaid = existing.status === OrderStatus.PAID;
  const paidAt = isAlreadyPaid ? existing.updatedAt : new Date();
  const result =
    isAlreadyPaid
      ? existing
      : await shopOrdersCollection().findOneAndUpdate(
          { _id: id },
          { $set: { status: OrderStatus.PAID, updatedAt: paidAt } },
          { returnDocument: 'after' }
        );

  if (!result) {
    throw new Error('Shop order not found.');
  }

  if (!isAlreadyPaid && result.items.length > 0) {
    const normalizedItems = result.items.map((item, index) =>
      normalizeEmbeddedOrderItem(result._id, item, index, paidAt)
    );
    await shopOrdersCollection().updateOne(
      { _id: id },
      {
        $set: {
          items: normalizedItems.map((item) => ({
            ...item,
            status: OrderStatus.PENDING,
            timestamp: paidAt,
          })),
          updatedAt: paidAt,
        },
      }
    );

    await productsCollection().bulkWrite(
      result.items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { stockQuantity: -item.quantity }, $set: { updatedAt: paidAt } }
        }
      }))
    );
  }

  return {
    id: result._id,
    userId: result.userId,
    status: result.status,
    totalAed: result.totalAed,
    stripeSessionId: result.stripeSessionId,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  } satisfies ShopOrder;
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

export const listUserShopOrdersBasic = async (userId: string, take = 100) => {
  const rows = await shopOrdersCollection()
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray();

  return rows.map((row) => ({
    id: row._id,
    status: row.status,
    totalAed: row.totalAed,
    createdAt: row.createdAt
  }));
};

export const listMerchantOrderLineItems = async (input: {
  adminId: string;
  merchantId?: string;
  skip: number;
  take: number;
}) => {
  const managedProfiles = input.merchantId
    ? await merchantProfilesCollection().find({ _id: input.merchantId, adminIds: input.adminId }).toArray()
    : await merchantProfilesCollection().find({ adminIds: input.adminId }).toArray();

  const merchantIds = managedProfiles.map((profile) => profile._id);
  if (merchantIds.length === 0) {
    return { items: [], total: 0 };
  }

  const products = await productsCollection().find({ merchantId: { $in: merchantIds } }).toArray();
  if (products.length === 0) {
    return { items: [], total: 0 };
  }

  const productIds = products.map((product) => product._id);
  const productMap = new Map(products.map((product) => [product._id, product]));

  const paidOrders = await shopOrdersCollection()
    .find({ status: OrderStatus.PAID, 'items.productId': { $in: productIds } })
    .sort({ updatedAt: -1 })
    .toArray();

  const flattened = paidOrders.flatMap((order) =>
    order.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => productIds.includes(item.productId))
      .map(({ item, index }) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return mapEmbeddedLineItemForMerchant(
          order._id,
          normalizeEmbeddedOrderItem(order._id, item, index, order.updatedAt),
          product
        );
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  );

  flattened.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const total = flattened.length;
  const items = flattened.slice(input.skip, input.skip + input.take);

  return { total, items };
};

export const updateMerchantOrderLineItemStatus = async (input: {
  adminId: string;
  orderLineItemId: string;
  status: OrderStatus;
  fulfillmentTrackingLink?: string | null;
}) => {
  const order = await shopOrdersCollection().findOne({ 'items.id': input.orderLineItemId });
  if (!order) {
    throw new Error('Order line item not found.');
  }

  const lineItem = order.items.find((item) => item.id === input.orderLineItemId);
  if (!lineItem) {
    throw new Error('Order line item not found.');
  }

  const product = await productsCollection().findOne({ _id: lineItem.productId });
  if (!product) {
    throw new Error('Product not found.');
  }

  const merchant = await merchantProfilesCollection().findOne({ _id: product.merchantId, adminIds: input.adminId });
  if (!merchant) {
    throw new Error('Merchant order access denied.');
  }

  const result = await shopOrdersCollection().findOneAndUpdate(
    { _id: order._id, 'items.id': input.orderLineItemId },
    {
      $set: {
        'items.$.status': input.status,
        'items.$.fulfillmentTrackingLink': input.fulfillmentTrackingLink ?? null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Order line item not found.');
  }

  const updatedItem = result.items.find((item) => item.id === input.orderLineItemId);
  if (!updatedItem) {
    throw new Error('Order line item not found.');
  }

  return mapEmbeddedLineItemForMerchant(
    result._id,
    normalizeEmbeddedOrderItem(result._id, updatedItem, 0, result.updatedAt),
    product
  );
};

export const getMerchantAnalytics = async (input: {
  adminId: string;
  merchantId?: string;
  startDate: Date;
  endDate: Date;
  interval: MerchantAnalyticsInterval;
}) => {
  const managedProfiles = input.merchantId
    ? await merchantProfilesCollection().find({ _id: input.merchantId, adminIds: input.adminId }).toArray()
    : await merchantProfilesCollection().find({ adminIds: input.adminId }).toArray();

  const merchantIds = managedProfiles.map((profile) => profile._id);
  const points = buildEmptyAnalyticsPoints(input.startDate, input.endDate, input.interval);
  if (merchantIds.length === 0) {
    return { merchantIds, points };
  }

  const productIds = (
    await productsCollection().find({ merchantId: { $in: merchantIds } }).project({ _id: 1 }).toArray()
  ).map((product) => product._id);

  if (productIds.length === 0) {
    return { merchantIds, points };
  }

  const bucketExpression = buildAnalyticsBucketExpression(input.interval);
  const rangeMatch = {
    productId: { $in: productIds },
    timestamp: { $gte: input.startDate, $lte: input.endDate },
  };

  const [salesRows, clickRows] = await Promise.all([
    shopOrdersCollection()
      .aggregate<{
        _id: string;
        salesAed: number;
        orderCount: number;
        quantitySold: number;
      }>([
        { $match: { status: OrderStatus.PAID } },
        { $unwind: '$items' },
        {
          $match: {
            'items.productId': { $in: productIds },
            'items.timestamp': { $gte: input.startDate, $lte: input.endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: analyticsBucketFormats[input.interval],
                date: '$items.timestamp',
                timezone: 'UTC',
              },
            },
            salesAed: { $sum: '$items.totalAed' },
            orderCount: { $sum: 1 },
            quantitySold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    productClicksCollection()
      .aggregate<{
        _id: string;
        clicks: number;
      }>([
        { $match: rangeMatch },
        {
          $group: {
            _id: bucketExpression,
            clicks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray()
  ]);

  const pointMap = new Map(points.map((point) => [point.bucket, point]));

  for (const row of salesRows) {
    const point = pointMap.get(row._id);
    if (!point) continue;
    point.salesAed = row.salesAed;
    point.orderCount = row.orderCount;
    point.quantitySold = row.quantitySold;
  }

  for (const row of clickRows) {
    const point = pointMap.get(row._id);
    if (!point) continue;
    point.clicks = row.clicks;
  }

  return {
    merchantIds,
    points: Array.from(pointMap.values())
  };
};
