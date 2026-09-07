import { Router } from 'express';
import { OrderStatus, ProductStatus } from '../domain/enums.js';
import ExcelJS from 'exceljs';
import { UserRole } from '../domain/enums.js';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { env } from '../config/env.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMerchantProduct,
  createMerchantProfileForUser,
  createShopOrderWithItems,
  deactivateMerchantProductById,
  findActiveProductById,
  findMerchantProductById,
  findMerchantPublicById,
  findManagedMerchantProfileById,
  getMerchantAnalytics,
  listMerchantOrderLineItems,
  listActiveProductsByIds,
  listManagedMerchantProfiles,
  listMerchantProducts,
  listPublicProducts,
  setShopOrderStripeSession,
  updateMerchantOrderLineItemStatus,
  updateMerchantProductById,
  updateManagedMerchantProfileById
} from '../lib/shop-store.js';

export const shopRouter = Router();

const idParamSchema = z.object({ id: z.string().min(1) });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

const merchantScopeSchema = z.object({
  merchantId: z.string().min(1).optional()
});

// ─── Public Routes ──────────────────────────────────────────────────────────

const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional()
});

shopRouter.get('/products', validate({ query: productListSchema }), async (req, res, next) => {
  try {
    const { page, pageSize, category, search } = req.query as unknown as z.infer<typeof productListSchema>;

    const { total, items: products } = await listPublicProducts({
      category,
      search,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        priceAed: p.priceAed,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        discountPercent: p.discountPercent,
        externalUrl: p.externalUrl,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        merchantId: p.merchant.id,
        merchantName: p.merchant.shopName,
        latitude: p.merchant.latitude ?? null,
        longitude: p.merchant.longitude ?? null,
        region: p.merchant.region ?? null
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/products/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const product = await findActiveProductById(id);
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');

    res.json({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        priceAed: product.priceAed,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        discountPercent: product.discountPercent,
        externalUrl: product.externalUrl,
        packagingInfo: product.packagingInfo,
        category: product.category,
        status: product.status.toLowerCase(),
        merchantId: product.merchant.id,
        merchantName: product.merchant.shopName,
        latitude: product.merchant.latitude ?? null,
        longitude: product.merchant.longitude ?? null,
        region: product.merchant.region ?? null,
        merchant: {
          id: product.merchant.id,
          shopName: product.merchant.shopName,
          description: product.merchant.description,
          logo: product.merchant.logo,
          latitude: product.merchant.latitude ?? null,
          longitude: product.merchant.longitude ?? null,
          region: product.merchant.region ?? null
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchants/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const merchant = await findMerchantPublicById(id);
    if (!merchant) throw new ApiError(404, 'merchant_not_found', 'Merchant not found.');

    res.json({
      data: {
        id: merchant.id,
        shopName: merchant.shopName,
        description: merchant.description,
        logo: merchant.logo,
        contactEmail: merchant.contactEmail,
        contactPhone: merchant.contactPhone,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        region: merchant.region,
        products: merchant.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          priceAed: p.priceAed,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          discountPercent: p.discountPercent,
          category: p.category,
          status: p.status.toLowerCase()
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/checkout/config', (_req, res) => {
  res.json({ data: { stripeEnabled: isStripeConfigured() } });
});

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10)
});

const checkoutSchema = z
  .object({
    productId: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(10).default(1),
    items: z.array(checkoutItemSchema).min(1).max(20).optional(),
    includeVat: z.boolean().optional().default(true)
  })
  .refine((body) => Boolean(body.items?.length || body.productId), {
    message: 'Provide productId or items'
  });

shopRouter.post('/checkout', requireAuth, requireVerifiedEmail, validate({ body: checkoutSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof checkoutSchema>;
    const lineInputs =
      body.items && body.items.length > 0
        ? body.items
        : [{ productId: body.productId!, quantity: body.quantity }];

    const productIds = [...new Set(lineInputs.map((line) => line.productId))];
    const products = await listActiveProductsByIds(productIds);
    if (products.length !== productIds.length) {
      throw new ApiError(404, 'product_not_found', 'One or more products were not found.');
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const external = lineInputs.find((line) => productById.get(line.productId)?.externalUrl);
    if (external) {
      throw new ApiError(400, 'external_product', 'Cart contains a product that uses an external buy link.');
    }

    const orderLines = lineInputs.map((line) => {
      const product = productById.get(line.productId)!;
      return { product, quantity: line.quantity, unitPrice: product.priceAed };
    });
    const subtotalAed = orderLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const includeVat = body.includeVat !== false;
    const vatAed = includeVat ? Math.round(subtotalAed * 0.05) : 0;
    const totalAed = subtotalAed + vatAed;

    const stripe = await getStripe();

    const order = await createShopOrderWithItems({
      userId: req.auth!.userId,
      totalAed,
      items: orderLines.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        unitPriceAed: line.unitPrice
      }))
    });

    const cancelPath =
      orderLines.length === 1
        ? `/product/${orderLines[0].product.id}?checkout=cancelled`
        : '/shop?checkout=cancelled';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${env.APP_BASE_URL}/shop?checkout=success&order=${order.id}`,
      cancel_url: `${env.APP_BASE_URL}${cancelPath}`,
      client_reference_id: order.id,
      metadata: { orderId: order.id, userId: req.auth!.userId },
      line_items: [
        ...orderLines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: 'aed',
            unit_amount: line.unitPrice * 100,
            product_data: {
              name: line.product.name,
              description: line.product.description?.slice(0, 200) ?? undefined,
              images: line.product.images.slice(0, 1)
            }
          }
        })),
        ...(vatAed > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: 'aed',
                  unit_amount: vatAed * 100,
                  product_data: { name: 'VAT (5%)' }
                }
              }
            ]
          : [])
      ]
    });

    await setShopOrderStripeSession(order.id, session.id);

    res.json({ data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    next(error);
  }
});

// ─── Merchant Routes (auth required) ────────────────────────────────────────

const merchantProfileSchema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  region: z.string().max(80).optional().nullable()
});

const merchantProfilePatchSchema = merchantProfileSchema.partial();

const productCreateSchema = z.object({
  merchantId: z.string().min(1).optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).default([]),
  priceAed: z.number().int().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  discountPercent: z.number().int().min(0).max(100).optional(),
  packagingInfo: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  status: z.enum(['draft', 'active']).default('draft')
});

const productPatchSchema = productCreateSchema.partial();

const merchantProductsQuerySchema = paginationSchema.merge(merchantScopeSchema);
const merchantOrdersQuerySchema = paginationSchema.merge(merchantScopeSchema);

const merchantAnalyticsQuerySchema = merchantScopeSchema
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    interval: z.enum(['day', 'month', 'year']).default('day')
  })
  .superRefine((input, ctx) => {
    if (input.endDate < input.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be on or after startDate.'
      });
    }
  });

const merchantOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  fulfillmentTrackingLink: z.string().url().optional().or(z.literal('')).transform((value) => value || undefined)
});

const orderIdParamSchema = z.object({ orderId: z.string().min(1) });

const normalizeAnalyticsRange = (startDate: Date, endDate: Date) => ({
  startDate: new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0, 0)),
  endDate: new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999))
});

const slugifyFilePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'merchant';

const serializeMerchantProfile = (profile: {
  id: string;
  shopName: string;
  description: string | null;
  logo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
}) => ({
  id: profile.id,
  shopName: profile.shopName,
  description: profile.description,
  logo: profile.logo,
  contactEmail: profile.contactEmail,
  contactPhone: profile.contactPhone,
  latitude: profile.latitude ?? null,
  longitude: profile.longitude ?? null,
  region: profile.region ?? null
});

const toSharedOrderStatus = (status: OrderStatus) => status.toLowerCase() as z.infer<typeof merchantOrderStatusSchema>['status'];

async function getManagedMerchantProfile(userId: string, merchantId?: string) {
  if (merchantId) {
    const profile = await findManagedMerchantProfileById(userId, merchantId);
    if (!profile) {
      throw new ApiError(403, 'forbidden', 'You are not authorized to manage this store.');
    }
    return profile;
  }

  const profiles = await listManagedMerchantProfiles(userId);
  return profiles[0] ?? null;
}

async function assertMerchantProductAdmin(userId: string, productId: string) {
  const product = await findMerchantProductById(productId);
  if (!product) {
    throw new ApiError(404, 'product_not_found', 'Product not found.');
  }

  const profile = await findManagedMerchantProfileById(userId, product.merchantId);
  if (!profile) {
    throw new ApiError(403, 'forbidden', 'You are not authorized to manage this product.');
  }

  return { product, profile };
}

shopRouter.get('/merchant/stores', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const stores = await listManagedMerchantProfiles(req.auth!.userId);
    res.json({ data: stores.map(serializeMerchantProfile) });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchant/profile', requireAuth, requireVerifiedEmail, validate({ query: merchantScopeSchema }), async (req, res, next) => {
  try {
    const { merchantId } = req.query as z.infer<typeof merchantScopeSchema>;
    const profile = await getManagedMerchantProfile(req.auth!.userId, merchantId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found. Create one first.');

    res.json({
      data: serializeMerchantProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.post('/merchant/profile', requireAuth, requireVerifiedEmail, validate({ body: merchantProfileSchema }), async (req, res, next) => {
  try {
    if (req.auth!.role !== UserRole.MERCHANT_ADMIN && req.auth!.role !== UserRole.PLATFORM_ADMIN) {
      throw new ApiError(403, 'forbidden', 'Merchant accounts are provisioned by a platform administrator.');
    }
    const userId = req.auth!.userId;
    const body = req.body as z.infer<typeof merchantProfileSchema>;
    const profile = await createMerchantProfileForUser(userId, body);

    res.status(201).json({
      data: serializeMerchantProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.patch('/merchant/profile', requireAuth, requireVerifiedEmail, validate({ query: merchantScopeSchema, body: merchantProfilePatchSchema }), async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { merchantId } = req.query as z.infer<typeof merchantScopeSchema>;
    const existing = await getManagedMerchantProfile(userId, merchantId);
    if (!existing) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const body = req.body as z.infer<typeof merchantProfilePatchSchema>;
    const updated = await updateManagedMerchantProfileById(userId, existing.id, body);

    res.json({
      data: serializeMerchantProfile(updated)
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchant/products', requireAuth, requireVerifiedEmail, validate({ query: merchantProductsQuerySchema }), async (req, res, next) => {
  try {
    const { merchantId, page, pageSize } = req.query as unknown as z.infer<typeof merchantProductsQuerySchema>;
    const profile = await getManagedMerchantProfile(req.auth!.userId, merchantId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const { items: products, total } = await listMerchantProducts({
      merchantId: profile.id,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        priceAed: p.priceAed,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        discountPercent: p.discountPercent,
        externalUrl: p.externalUrl,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        createdAt: p.createdAt.toISOString()
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.post('/merchant/products', requireAuth, requireVerifiedEmail, validate({ body: productCreateSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof productCreateSchema>;
    const profile = await getManagedMerchantProfile(req.auth!.userId, body.merchantId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Create a merchant profile first.');

    const product = await createMerchantProduct({
      merchantId: profile.id,
      name: body.name,
      description: body.description,
      images: body.images,
      priceAed: body.priceAed,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      discountPercent: body.discountPercent,
      packagingInfo: body.packagingInfo,
      category: body.category,
      status: body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT
    });

    res.status(201).json({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        priceAed: product.priceAed,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        discountPercent: product.discountPercent,
        packagingInfo: product.packagingInfo,
        category: product.category,
        status: product.status.toLowerCase()
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.patch('/merchant/products/:id', requireAuth, requireVerifiedEmail, validate({ params: idParamSchema, body: productPatchSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    await assertMerchantProductAdmin(req.auth!.userId, id);

    const body = req.body as z.infer<typeof productPatchSchema>;
    const updateData: Record<string, unknown> = { ...body };
    delete updateData.merchantId;
    if (body.status) {
      updateData.status = body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
    }

    const updated = await updateMerchantProductById(id, updateData);

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        images: updated.images,
        priceAed: updated.priceAed,
        stockQuantity: updated.stockQuantity,
        lowStockThreshold: updated.lowStockThreshold,
        discountPercent: updated.discountPercent,
        packagingInfo: updated.packagingInfo,
        category: updated.category,
        status: updated.status.toLowerCase()
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.delete('/merchant/products/:id', requireAuth, requireVerifiedEmail, validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    await assertMerchantProductAdmin(req.auth!.userId, id);

    await deactivateMerchantProductById(id);

    res.json({ message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchant/orders', requireAuth, requireVerifiedEmail, validate({ query: merchantOrdersQuerySchema }), async (req, res, next) => {
  try {
    const { merchantId, page, pageSize } = req.query as unknown as z.infer<typeof merchantOrdersQuerySchema>;
    if (merchantId) {
      await getManagedMerchantProfile(req.auth!.userId, merchantId);
    }

    const { items, total } = await listMerchantOrderLineItems({
      adminId: req.auth!.userId,
      merchantId,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      data: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        totalAed: item.totalAed,
        status: toSharedOrderStatus(item.status),
        fulfillmentTrackingLink: item.fulfillmentTrackingLink,
        timestamp: item.timestamp.toISOString(),
        product: item.product
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.patch('/merchant/orders/:orderId/status', requireAuth, requireVerifiedEmail, validate({ params: orderIdParamSchema, body: merchantOrderStatusSchema }), async (req, res, next) => {
  try {
    const { orderId } = req.params as z.infer<typeof orderIdParamSchema>;
    const body = req.body as z.infer<typeof merchantOrderStatusSchema>;
    const updated = await updateMerchantOrderLineItemStatus({
      adminId: req.auth!.userId,
      orderLineItemId: orderId,
      status: body.status.toUpperCase() as OrderStatus,
      fulfillmentTrackingLink: body.fulfillmentTrackingLink
    });

    res.json({
      data: {
        id: updated.id,
        orderId: updated.orderId,
        productId: updated.productId,
        quantity: updated.quantity,
        totalAed: updated.totalAed,
        status: toSharedOrderStatus(updated.status),
        fulfillmentTrackingLink: updated.fulfillmentTrackingLink,
        timestamp: updated.timestamp.toISOString(),
        product: updated.product
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Merchant order access denied.') {
      next(new ApiError(403, 'forbidden', 'You are not authorized to manage this order.'));
      return;
    }
    if (error instanceof Error && error.message === 'Order line item not found.') {
      next(new ApiError(404, 'order_not_found', 'Order not found.'));
      return;
    }
    next(error);
  }
});

shopRouter.get('/merchant/analytics/sales', requireAuth, requireVerifiedEmail, validate({ query: merchantAnalyticsQuerySchema }), async (req, res, next) => {
  try {
    const { merchantId, startDate, endDate, interval } = req.query as unknown as z.infer<typeof merchantAnalyticsQuerySchema>;
    if (merchantId) {
      await getManagedMerchantProfile(req.auth!.userId, merchantId);
    }

    const normalizedRange = normalizeAnalyticsRange(startDate, endDate);
    const analytics = await getMerchantAnalytics({
      adminId: req.auth!.userId,
      merchantId,
      startDate: normalizedRange.startDate,
      endDate: normalizedRange.endDate,
      interval
    });

    res.json({
      data: {
        merchantId,
        merchantIds: analytics.merchantIds,
        startDate: normalizedRange.startDate.toISOString(),
        endDate: normalizedRange.endDate.toISOString(),
        interval,
        points: analytics.points
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchant/analytics/export', requireAuth, requireVerifiedEmail, validate({ query: merchantAnalyticsQuerySchema }), async (req, res, next) => {
  try {
    const { merchantId, startDate, endDate, interval } = req.query as unknown as z.infer<typeof merchantAnalyticsQuerySchema>;
    const profile = merchantId ? await getManagedMerchantProfile(req.auth!.userId, merchantId) : null;
    const normalizedRange = normalizeAnalyticsRange(startDate, endDate);
    const analytics = await getMerchantAnalytics({
      adminId: req.auth!.userId,
      merchantId,
      startDate: normalizedRange.startDate,
      endDate: normalizedRange.endDate,
      interval
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics');
    worksheet.columns = [
      { header: 'Period', key: 'bucket', width: 16 },
      { header: 'Sales (AED)', key: 'salesAed', width: 16 },
      { header: 'Clicks', key: 'clicks', width: 12 },
      { header: 'Orders', key: 'orderCount', width: 12 },
      { header: 'Units Sold', key: 'quantitySold', width: 12 }
    ];
    analytics.points.forEach((point) => {
      worksheet.addRow(point);
    });

    const namePart = slugifyFilePart(profile?.shopName ?? 'merchant-analytics');
    const filename = `${namePart}-${interval}-${normalizedRange.startDate.toISOString().slice(0, 10)}-${normalizedRange.endDate.toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});
