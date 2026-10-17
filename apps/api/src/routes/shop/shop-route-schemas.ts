import { z } from 'zod';
import { OrderStatus } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import {
  findManagedMerchantProfileById,
  findMerchantProductById,
  findMerchantProfileByTenantId,
  listManagedMerchantProfiles,
} from '../../services/shop-merchant-read.js';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const shopScopeSchema = z.object({
  merchantId: z.string().min(1).optional(),
  shopId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
});

export type ShopManageScope = z.infer<typeof shopScopeSchema>;

export const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const checkoutSchema = z
  .object({
    productId: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(10).default(1),
    items: z.array(checkoutItemSchema).min(1).max(20).optional(),
    includeVat: z.boolean().optional().default(true),
  })
  .refine((body) => Boolean(body.items?.length || body.productId), {
    message: 'Provide productId or items',
  });

export const merchantProfileSchema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  websiteUrl: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  region: z.string().max(80).optional().nullable(),
});

export const merchantProfilePatchSchema = merchantProfileSchema.partial();

export const productCreateSchema = z.object({
  merchantId: z.string().min(1).optional(),
  shopId: z.string().min(1).optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).default([]),
  priceAed: z.number().int().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  discountPercent: z.number().int().min(0).max(100).optional(),
  externalUrl: z.string().url().optional().nullable(),
  packagingInfo: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  status: z.enum(['draft', 'active']).default('draft'),
});

export const productPatchSchema = productCreateSchema.partial();

export const merchantProductsQuerySchema = paginationSchema.merge(shopScopeSchema);
export const merchantOrdersQuerySchema = paginationSchema.merge(shopScopeSchema);

export const merchantAnalyticsQuerySchema = shopScopeSchema
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    interval: z.enum(['day', 'month', 'year']).default('day'),
  })
  .superRefine((input, ctx) => {
    if (input.endDate < input.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be on or after startDate.',
      });
    }
  });

export const merchantOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  fulfillmentTrackingLink: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
});

export const orderIdParamSchema = z.object({ orderId: z.string().min(1) });

/** Live dual prefixes — `/organisation/*` stays next to `/merchant/*` (not a leftover file). */
export const shopOrganisationManagePrefixes = ['/merchant', '/organisation'] as const;

export const normalizeAnalyticsRange = (startDate: Date, endDate: Date) => ({
  startDate: new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0, 0)
  ),
  endDate: new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999)
  ),
});

export const slugifyFilePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'merchant';

export const serializeMerchantProfile = (profile: {
  id: string;
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
}) => ({
  id: profile.id,
  shopId: profile.id,
  merchantId: profile.id,
  tenantId: profile.tenantId ?? null,
  shopName: profile.shopName,
  description: profile.description,
  logo: profile.logo,
  websiteUrl: profile.websiteUrl ?? null,
  contactEmail: profile.contactEmail,
  contactPhone: profile.contactPhone,
  latitude: profile.latitude ?? null,
  longitude: profile.longitude ?? null,
  region: profile.region ?? null,
});

export async function getManagedMerchantProfile(userId: string, scope?: ShopManageScope | string) {
  const resolvedScope: ShopManageScope = typeof scope === 'string' ? { merchantId: scope } : (scope ?? {});
  const merchantKey = resolvedScope.merchantId ?? resolvedScope.shopId;

  if (merchantKey) {
    const profile = await findManagedMerchantProfileById(userId, merchantKey);
    if (!profile) {
      throw new ApiError(403, 'forbidden', 'You are not authorized to manage this store.');
    }
    return profile;
  }

  if (resolvedScope.tenantId) {
    const linked = await findMerchantProfileByTenantId(resolvedScope.tenantId);
    if (!linked) return null;
    const profile = await findManagedMerchantProfileById(userId, linked.id);
    if (!profile) {
      throw new ApiError(403, 'forbidden', 'You are not authorized to manage this store.');
    }
    return profile;
  }

  const profiles = await listManagedMerchantProfiles(userId);
  return profiles[0] ?? null;
}

export async function assertMerchantProductAdmin(userId: string, productId: string) {
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

export const toSharedOrderStatus = (status: OrderStatus) =>
  status.toLowerCase() as z.infer<typeof merchantOrderStatusSchema>['status'];
