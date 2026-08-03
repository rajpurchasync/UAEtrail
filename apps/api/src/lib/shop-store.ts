import { randomUUID } from 'crypto';
import { OrderStatus, ProductStatus } from '../domain/enums.js';
import type { MerchantProfile, Product, ShopOrder } from '../domain/types.js';
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
  userId: string;
  shopName: string;
  description: string | null;
  logo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
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
  discountPercent: number | null;
  externalUrl: string | null;
  packagingInfo: string | null;
  category: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

type MerchantProfileUpdate = Partial<
  Pick<MerchantProfile, 'shopName' | 'description' | 'logo' | 'contactEmail' | 'contactPhone'>
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

const mapMongoProduct = (item: MongoProduct): Product => ({
  id: item._id,
  merchantId: item.merchantId,
  name: item.name,
  description: item.description,
  images: item.images,
  priceAed: item.priceAed,
  discountPercent: item.discountPercent,
  externalUrl: item.externalUrl,
  packagingInfo: item.packagingInfo,
  category: item.category,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const mapMongoMerchantProfile = (merchant: MongoMerchantProfile): MerchantProfile => ({
  id: merchant._id,
  userId: merchant.userId,
  shopName: merchant.shopName,
  description: merchant.description,
  logo: merchant.logo,
  contactEmail: merchant.contactEmail,
  contactPhone: merchant.contactPhone,
  createdAt: merchant.createdAt,
  updatedAt: merchant.updatedAt
});

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
          discountPercent: item.discountPercent,
          externalUrl: item.externalUrl,
          packagingInfo: item.packagingInfo,
          category: item.category,
          status: item.status,
          merchant: {
            id: merchant._id,
            shopName: merchant.shopName
          }
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  };
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
      logo: merchant.logo
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
  const merchant = await merchantProfilesCollection().findOne({ userId });
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
  }
) => {
  const now = new Date();
  const doc: MongoMerchantProfile = {
    _id: randomUUID(),
    userId,
    shopName: data.shopName,
    description: data.description ?? null,
    logo: data.logo ?? null,
    contactEmail: data.contactEmail ?? null,
    contactPhone: data.contactPhone ?? null,
    createdAt: now,
    updatedAt: now
  };
  await merchantProfilesCollection().insertOne(doc);
  return mapMongoMerchantProfile(doc);
};

export const updateMerchantProfileForUser = async (userId: string, data: MerchantProfileUpdate) => {
  const updatedAt = new Date();
  const result = await merchantProfilesCollection().findOneAndUpdate(
    { userId },
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

export const findMerchantProductById = async (id: string, merchantId: string) => {
  const item = await productsCollection().findOne({ _id: id, merchantId });
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
  const result = await shopOrdersCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status: OrderStatus.PAID, updatedAt: new Date() } },
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
  await merchantProfilesCollection().deleteMany({ userId });
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
