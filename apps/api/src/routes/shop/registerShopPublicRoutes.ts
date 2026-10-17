import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { findActiveProductById, findMerchantPublicById, listPublicProducts } from '../../services/shop-public-read.js';
import { idParamSchema, productListSchema } from './shop-route-schemas.js';

async function handleShopPublic(
  req: { params: z.infer<typeof idParamSchema> },
  res: { json: (body: unknown) => void },
  next: (error: unknown) => void
) {
  try {
    const { id } = req.params;
    const merchant = await findMerchantPublicById(id);
    if (!merchant) throw new ApiError(404, 'merchant_not_found', 'Shop not found.');

    res.json({
      data: {
        id: merchant.id,
        shopId: merchant.id,
        merchantId: merchant.id,
        tenantId: merchant.tenantId ?? null,
        shopName: merchant.shopName,
        description: merchant.description,
        logo: merchant.logo,
        contactEmail: merchant.contactEmail,
        contactPhone: merchant.contactPhone,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        region: merchant.region,
        contactPersonName: merchant.contactPersonName ?? null,
        contactPersonAvatar: merchant.contactPersonAvatar ?? null,
        contactPersonUserId: merchant.contactPersonUserId ?? null,
        websiteUrl: merchant.websiteUrl ?? null,
        products: merchant.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          priceAed: p.priceAed,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          discountPercent: p.discountPercent,
          externalUrl: p.externalUrl,
          category: p.category,
          status: p.status.toLowerCase(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/** Public catalog + storefront (`GET /shop/products*`, `GET /shop/shops/:id`; `/merchants/:id` alias). */
export const registerShopPublicRoutes = (router: Router): void => {
  router.get('/products', validate({ query: productListSchema }), async (req, res, next) => {
    try {
      const { page, pageSize, category, search } = req.query as unknown as z.infer<typeof productListSchema>;

      const { total, items: products } = await listPublicProducts({
        category,
        search,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
          region: p.merchant.region ?? null,
        })),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id', validate({ params: idParamSchema }), async (req, res, next) => {
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
            region: product.merchant.region ?? null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/merchants/:id', validate({ params: idParamSchema }), handleShopPublic);
  /** Preferred public path — live alias of `/merchants/:id`. */
  router.get('/shops/:id', validate({ params: idParamSchema }), handleShopPublic);
};
