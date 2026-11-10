import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { findMerchantPublicById } from '../../services/shop-public-read.js';
import { idParamSchema, serializeMerchantPublicProfile } from './shop-route-schemas.js';

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
      data: serializeMerchantPublicProfile(merchant),
    });
  } catch (error) {
    next(error);
  }
}

/** Public storefront (`GET /shop/shops/:id`; `/merchants/:id` alias). */
export const registerShopPublicRoutes = (router: Router): void => {
  router.get('/merchants/:id', validate({ params: idParamSchema }), handleShopPublic);
  /** Preferred public path — live alias of `/merchants/:id`. */
  router.get('/shops/:id', validate({ params: idParamSchema }), handleShopPublic);
};
