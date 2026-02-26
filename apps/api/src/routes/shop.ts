import { ProductStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { createAuditLog } from '../lib/audit.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const shopRouter = Router();

const idParamSchema = z.object({ id: z.string().min(1) });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

// ─── Public Routes ──────────────────────────────────────────────────────────

const productListSchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional()
});

shopRouter.get('/products', validate({ query: productListSchema }), async (req, res, next) => {
  try {
    const { page, pageSize, category, search } = req.query as unknown as z.infer<typeof productListSchema>;

    const where = {
      status: ProductStatus.ACTIVE,
      ...(category ? { category } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {})
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { merchant: { select: { id: true, shopName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        priceAed: p.priceAed,
        discountPercent: p.discountPercent,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        merchantId: p.merchant.id,
        merchantName: p.merchant.shopName
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
    const product = await prisma.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      include: { merchant: { select: { id: true, shopName: true, description: true, logo: true } } }
    });
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');

    res.json({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        priceAed: product.priceAed,
        discountPercent: product.discountPercent,
        packagingInfo: product.packagingInfo,
        category: product.category,
        status: product.status.toLowerCase(),
        merchantId: product.merchant.id,
        merchantName: product.merchant.shopName,
        merchant: {
          id: product.merchant.id,
          shopName: product.merchant.shopName,
          description: product.merchant.description,
          logo: product.merchant.logo
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
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: ProductStatus.ACTIVE },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!merchant) throw new ApiError(404, 'merchant_not_found', 'Merchant not found.');

    res.json({
      data: {
        id: merchant.id,
        shopName: merchant.shopName,
        description: merchant.description,
        logo: merchant.logo,
        contactEmail: merchant.contactEmail,
        contactPhone: merchant.contactPhone,
        products: merchant.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          priceAed: p.priceAed,
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

// ─── Merchant Routes (auth required) ────────────────────────────────────────

const merchantProfileSchema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional()
});

const merchantProfilePatchSchema = merchantProfileSchema.partial();

const productCreateSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).default([]),
  priceAed: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  packagingInfo: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  status: z.enum(['draft', 'active']).default('draft')
});

const productPatchSchema = productCreateSchema.partial();

// Helper to get or verify merchant profile
async function getMerchantProfile(userId: string) {
  return prisma.merchantProfile.findUnique({ where: { userId } });
}

shopRouter.get('/merchant/profile', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const profile = await getMerchantProfile(req.auth!.userId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found. Create one first.');

    res.json({
      data: {
        id: profile.id,
        shopName: profile.shopName,
        description: profile.description,
        logo: profile.logo,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.post('/merchant/profile', requireAuth, requireVerifiedEmail, validate({ body: merchantProfileSchema }), async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const existing = await getMerchantProfile(userId);
    if (existing) throw new ApiError(409, 'profile_exists', 'Merchant profile already exists.');

    const body = req.body as z.infer<typeof merchantProfileSchema>;
    const profile = await prisma.merchantProfile.create({
      data: { userId, ...body }
    });

    res.status(201).json({
      data: {
        id: profile.id,
        shopName: profile.shopName,
        description: profile.description,
        logo: profile.logo,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.patch('/merchant/profile', requireAuth, requireVerifiedEmail, validate({ body: merchantProfilePatchSchema }), async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const existing = await getMerchantProfile(userId);
    if (!existing) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const body = req.body as z.infer<typeof merchantProfilePatchSchema>;
    const updated = await prisma.merchantProfile.update({
      where: { userId },
      data: body
    });

    res.json({
      data: {
        id: updated.id,
        shopName: updated.shopName,
        description: updated.description,
        logo: updated.logo,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone
      }
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.get('/merchant/products', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const profile = await getMerchantProfile(req.auth!.userId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const products = await prisma.product.findMany({
      where: { merchantId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        priceAed: p.priceAed,
        discountPercent: p.discountPercent,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        createdAt: p.createdAt.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

shopRouter.post('/merchant/products', requireAuth, requireVerifiedEmail, validate({ body: productCreateSchema }), async (req, res, next) => {
  try {
    const profile = await getMerchantProfile(req.auth!.userId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Create a merchant profile first.');

    const body = req.body as z.infer<typeof productCreateSchema>;
    const product = await prisma.product.create({
      data: {
        merchantId: profile.id,
        name: body.name,
        description: body.description,
        images: body.images,
        priceAed: body.priceAed,
        discountPercent: body.discountPercent,
        packagingInfo: body.packagingInfo,
        category: body.category,
        status: body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT
      }
    });

    res.status(201).json({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        priceAed: product.priceAed,
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
    const profile = await getMerchantProfile(req.auth!.userId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const { id } = req.params as z.infer<typeof idParamSchema>;
    const product = await prisma.product.findFirst({ where: { id, merchantId: profile.id } });
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found or not yours.');

    const body = req.body as z.infer<typeof productPatchSchema>;
    const updateData: Record<string, unknown> = { ...body };
    if (body.status) {
      updateData.status = body.status === 'active' ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        images: updated.images,
        priceAed: updated.priceAed,
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
    const profile = await getMerchantProfile(req.auth!.userId);
    if (!profile) throw new ApiError(404, 'profile_not_found', 'Merchant profile not found.');

    const { id } = req.params as z.infer<typeof idParamSchema>;
    const product = await prisma.product.findFirst({ where: { id, merchantId: profile.id } });
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found or not yours.');

    await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.INACTIVE }
    });

    res.json({ message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
});
