import { randomUUID } from 'crypto';
import { OrderStatus, ProductStatus } from '../domain/enums.js';
import type { MerchantProfile, Product, ProductClick, ShopOrder } from '../domain/types.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

type MongoStripeWebhookEvent = {
  _id: string;
  createdAt: Date;
};

type MongoShopOrder = {
  _id: string;
  userId: string;
  status: OrderStatus;
  totalAed: number;
  stripeSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceAed: number;
  }>;
};

type MongoMerchantProfile = {
  _id: string;
  adminIds: string[];
  shopName: string;
  description: string | null;
  logo: string | null;
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
  getMongoClient()!.db().collection<MongoShopOrder>('shop_orders');

const merchantProfilesCollection = (): Collection<MongoMerchantProfile> =>
  getMongoClient()!.db().collection<MongoMerchantProfile>('merchant_profiles');

const productsCollection = (): Collection<MongoProduct> =>
  getMongoClient()!.db().collection<MongoProduct>('products');

const productClicksCollection = (): Collection<MongoProductClick> =>
  getMongoClient()!.db().collection<MongoProductClick>('product_clicks');

const orderLineItemsCollection = (): Collection<MongoOrderLineItem> =>
  getMongoClient()!.db().collection<MongoOrderLineItem>('order_line_items');

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

const mapMongoMerchantProfile = (merchant: MongoMerchantProfile): MerchantProfile => ({
  id: merchant._id,
  adminIds: merchant.adminIds,
  shopName: merchant.shopName,
  description: merchant.description,
  logo: merchant.logo,
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
  const query: Record<string, unknown> = {
    status: ProductStatus.ACTIVE,
    ...(input.category ? { category: input.category } : {}),
    ...(input.search ? { name: { $regex: input.search, $options: 'i' } } : {})
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
  const products = await productsCollection()
    .find({ status: ProductStatus.ACTIVE })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  const merchantIds = [...new Set(products.map((product) => product.merchantId))];
  if (merchantIds.length === 0) return [];

  const merchants = await merchantProfilesCollection().find({ _id: { $in: merchantIds } }).toArray();
  const productsByMerchant = new Map<string, MongoProduct[]>();
  for (const product of products) {
    const list = productsByMerchant.get(product.merchantId) ?? [];
    list.push(product);
    productsByMerchant.set(product.merchantId, list);
  }

  return merchants.map((merchant) => ({
    merchant: mapMongoMerchantProfile(merchant),
    products: (productsByMerchant.get(merchant._id) ?? []).map(mapMongoProduct)
  }));
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

  return {
    ...mapMongoMerchantProfile(merchant),
    products: products.map(mapMongoProduct)
  };
};

export const listActiveProductsByIds = async (productIds: string[]) => {
  if (productIds.length === 0) return [];

  const items = await productsCollection()
    .find({ _id: { $in: productIds }, status: ProductStatus.ACTIVE })
    .toArray();
  return items.map(mapMongoProduct);
};

export const findMerchantProfileByUserId = async (userId: string) => {
  const merchant = await merchantProfilesCollection().findOne(
    { adminIds: userId },
    { sort: { createdAt: 1 } }
  );
  return merchant ? mapMongoMerchantProfile(merchant) : null;
};

export const listManagedMerchantProfiles = async (adminId: string) => {
  const merchants = await merchantProfilesCollection().find({ adminIds: adminId }).sort({ createdAt: 1 }).toArray();
  return merchants.map(mapMongoMerchantProfile);
};

export const findManagedMerchantProfileById = async (adminId: string, merchantId: string) => {
  const merchant = await merchantProfilesCollection().findOne({ _id: merchantId, adminIds: adminId });
  return merchant ? mapMongoMerchantProfile(merchant) : null;
};

export const createMerchantProfileForUser = async (
  userId: string,
  data: {
    shopName: string;
    description?: string;
    logo?: string;
    contactEmail?: string;
    contactPhone?: string;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
  }
) => {
  const now = new Date();
  const doc: MongoMerchantProfile = {
    _id: randomUUID(),
    adminIds: [userId],
    shopName: data.shopName,
    description: data.description ?? null,
    logo: data.logo ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    region: data.region ?? null,
    createdAt: now,
    updatedAt: now
  };
  await merchantProfilesCollection().insertOne(doc);
  return mapMongoMerchantProfile(doc);
};

export const updateMerchantProfileForUser = async (userId: string, data: MerchantProfileUpdate) => {
  const merchant = await findMerchantProfileByUserId(userId);
  if (!merchant) {
    throw new Error('Merchant profile not found.');
  }
  return updateManagedMerchantProfileById(userId, merchant.id, data);
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
    throw new Error('Merchant profile not found.');
  }
  return mapMongoMerchantProfile(result);
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
    externalUrl: null,
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
    items: input.items
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
    await orderLineItemsCollection().bulkWrite(
      result.items.map((item, index) => ({
        updateOne: {
          filter: { _id: `${result._id}:${index}` },
          update: {
            $setOnInsert: {
              orderId: result._id,
              productId: item.productId,
              quantity: item.quantity,
              totalAed: item.quantity * item.unitPriceAed,
              status: OrderStatus.PENDING,
              fulfillmentTrackingLink: null,
              timestamp: paidAt
            }
          },
          upsert: true
        }
      }))
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
  const query = { productId: { $in: productIds } };

  const [items, total] = await Promise.all([
    orderLineItemsCollection().find(query).sort({ timestamp: -1 }).skip(input.skip).limit(input.take).toArray(),
    orderLineItemsCollection().countDocuments(query)
  ]);

  return {
    total,
    items: items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          id: item._id,
          orderId: item.orderId ?? item._id.split(':')[0] ?? item._id,
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
            lowStockThreshold: product.lowStockThreshold ?? 5
          }
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  };
};

export const updateMerchantOrderLineItemStatus = async (input: {
  adminId: string;
  orderLineItemId: string;
  status: OrderStatus;
  fulfillmentTrackingLink?: string | null;
}) => {
  const existing = await orderLineItemsCollection().findOne({ _id: input.orderLineItemId });
  if (!existing) {
    throw new Error('Order line item not found.');
  }

  const product = await productsCollection().findOne({ _id: existing.productId });
  if (!product) {
    throw new Error('Product not found.');
  }

  const merchant = await merchantProfilesCollection().findOne({ _id: product.merchantId, adminIds: input.adminId });
  if (!merchant) {
    throw new Error('Merchant order access denied.');
  }

  const result = await orderLineItemsCollection().findOneAndUpdate(
    { _id: input.orderLineItemId },
    {
      $set: {
        status: input.status,
        fulfillmentTrackingLink: input.fulfillmentTrackingLink ?? null,
        timestamp: existing.timestamp
      }
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Order line item not found.');
  }

  return {
    id: result._id,
    orderId: result.orderId ?? result._id.split(':')[0] ?? result._id,
    productId: result.productId,
    quantity: result.quantity,
    totalAed: result.totalAed,
    status: normalizeOrderLineItemStatus(result.status),
    fulfillmentTrackingLink: result.fulfillmentTrackingLink ?? null,
    timestamp: result.timestamp,
    product: {
      id: product._id,
      name: product.name,
      images: product.images,
      priceAed: product.priceAed,
      merchantId: product.merchantId,
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5
    }
  };
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
    timestamp: { $gte: input.startDate, $lte: input.endDate }
  };

  const [salesRows, clickRows] = await Promise.all([
    orderLineItemsCollection()
      .aggregate<{
        _id: string;
        salesAed: number;
        orderCount: number;
        quantitySold: number;
      }>([
        { $match: rangeMatch },
        {
          $group: {
            _id: bucketExpression,
            salesAed: { $sum: '$totalAed' },
            orderCount: { $sum: 1 },
            quantitySold: { $sum: '$quantity' }
          }
        },
        { $sort: { _id: 1 } }
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
