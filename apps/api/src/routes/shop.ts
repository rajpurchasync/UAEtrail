import { ProductStatus, OrderStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { createAuditLog } from '../lib/audit.js';
import { prisma } from '../lib/prisma.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { env } from '../config/env.js';
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
        externalUrl: p.externalUrl,
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
        externalUrl: product.externalUrl,
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

shopRouter.get('/checkout/config', (_req, res) => {
  res.json({ data: { stripeEnabled: isStripeConfigured() } });
});

const checkoutSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10).default(1)
});

shopRouter.post('/checkout', requireAuth, requireVerifiedEmail, validate({ body: checkoutSchema }), async (req, res, next) => {
  try {
    const { productId, quantity } = req.body as z.infer<typeof checkoutSchema>;
    const product = await prisma.product.findFirst({
      where: { id: productId, status: ProductStatus.ACTIVE }
    });
    if (!product) throw new ApiError(404, 'product_not_found', 'Product not found.');
    if (product.externalUrl) {
      throw new ApiError(400, 'external_product', 'This product uses an external buy link.');
    }

    const stripe = await getStripe();
    const unitPrice = product.priceAed;
    const totalAed = unitPrice * quantity;

    const order = await prisma.shopOrder.create({
      data: {
        userId: req.auth!.userId,
        totalAed,
        items: {
          create: {
            productId: product.id,
            quantity,
            unitPriceAed: unitPrice
          }
        }
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${env.APP_BASE_URL}/shop?checkout=success&order=${order.id}`,
      cancel_url: `${env.APP_BASE_URL}/product/${product.id}?checkout=cancelled`,
      client_reference_id: order.id,
      metadata: { orderId: order.id, userId: req.auth!.userId },
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'aed',
            unit_amount: unitPrice * 100,
            product_data: {
              name: product.name,
              description: product.description?.slice(0, 200) ?? undefined,
              images: product.images.slice(0, 1)
            }
          }
        }
      ]
    });

    await prisma.shopOrder.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id }
    });

    res.json({ data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook — mount raw body in app.ts if needed; here accept JSON for dev
shopRouter.post('/webhook/stripe', async (req, res, next) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'stripe_not_configured' });
      return;
    }

    const stripe = await getStripe();
    const sig = req.headers['stripe-signature'] as string | undefined;
    let event: import('stripe').Stripe.Event;

    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        (req as { rawBody?: Buffer }).rawBody ?? JSON.stringify(req.body),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else if (process.env.NODE_ENV !== 'production') {
      event = req.body as import('stripe').Stripe.Event;
    } else {
      throw new ApiError(400, 'missing_signature', 'Webhook signature required.');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (orderId) {
        await prisma.shopOrder.updateMany({
          where: { id: orderId, status: OrderStatus.PENDING },
          data: { status: OrderStatus.PAID }
        });
      }
    }

    res.json({ received: true });
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

    const pg = paginationSchema.parse(req.query);
    const where = { merchantId: profile.id };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pg.page - 1) * pg.pageSize,
        take: pg.pageSize
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        priceAed: p.priceAed,
        discountPercent: p.discountPercent,
        externalUrl: p.externalUrl,
        packagingInfo: p.packagingInfo,
        category: p.category,
        status: p.status.toLowerCase(),
        createdAt: p.createdAt.toISOString()
      })),
      meta: {
        page: pg.page,
        pageSize: pg.pageSize,
        total,
        totalPages: Math.ceil(total / pg.pageSize)
      }
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
