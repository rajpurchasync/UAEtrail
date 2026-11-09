import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { findMerchantPublicById } from '../../services/shop-public-read.js';
import { idParamSchema } from './shop-route-schemas.js';

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
      },
    });
  } catch (error) {
    next(error);
  }
}

/** Public storefront (`GET /shop/shops/:id`). */
export const registerShopPublicRoutes = (router: Router): void => {
  router.get('/shops/:id', validate({ params: idParamSchema }), handleShopPublic);
};
