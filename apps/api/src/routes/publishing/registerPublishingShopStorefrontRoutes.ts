import type { Router } from 'express';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { scheduleExploreMapCacheInvalidation } from '../../lib/explore-map-cache-schedule.js';
import { validate } from '../../middleware/validate.js';
import { assertPublishingShopTenant } from '../../services/publishing-shop-storefront.js';
import {
  createMerchantProfileForUser,
  syncShopTenantFromMerchantProfile,
  updateManagedMerchantProfileById,
} from '../../services/shop-merchant-commands.js';
import { userCanCreateShopProfile } from '../../services/shop-merchant-read.js';
import {
  getManagedMerchantProfile,
  merchantProfilePatchSchema,
  merchantProfileSchema,
  serializeMerchantProfile,
} from '../shop/shop-route-schemas.js';

/** Shop operator storefront — tenant-scoped manage (`x-tenant-id`). */
export const registerPublishingShopStorefrontRoutes = (publishingRouter: Router): void => {
  publishingRouter.get('/shop-profile', async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId;
      await assertPublishingShopTenant(tenantId);
      const profile = await getManagedMerchantProfile(req.auth!.userId, { tenantId });
      if (!profile) {
        throw new ApiError(404, 'profile_not_found', 'Shop profile not found. Create one first.');
      }
      res.json({ data: serializeMerchantProfile(profile) });
    } catch (error) {
      next(error);
    }
  });

  publishingRouter.post(
    '/shop-profile',
    validate({ body: merchantProfileSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        await assertPublishingShopTenant(tenantId);
        const userId = req.auth!.userId;
        if (!(await userCanCreateShopProfile(userId, req.auth!.role))) {
          throw new ApiError(
            403,
            'forbidden',
            'Shop profiles are created when your host application is approved, or by a platform administrator.'
          );
        }
        const existing = await getManagedMerchantProfile(userId, { tenantId });
        if (existing) {
          throw new ApiError(409, 'profile_exists', 'Shop profile already exists for this operator.');
        }
        const body = req.body as z.infer<typeof merchantProfileSchema>;
        const profile = await createMerchantProfileForUser(userId, body);
        await syncShopTenantFromMerchantProfile(userId, profile);
        scheduleExploreMapCacheInvalidation('shop.profile_map_cache');
        res.status(201).json({ data: serializeMerchantProfile(profile) });
      } catch (error) {
        next(error);
      }
    }
  );

  publishingRouter.patch(
    '/shop-profile',
    validate({ body: merchantProfilePatchSchema }),
    async (req, res, next) => {
      try {
        const tenantId = req.tenantContext!.tenantId;
        await assertPublishingShopTenant(tenantId);
        const userId = req.auth!.userId;
        const existing = await getManagedMerchantProfile(userId, { tenantId });
        if (!existing) {
          throw new ApiError(404, 'profile_not_found', 'Shop profile not found.');
        }
        const body = req.body as z.infer<typeof merchantProfilePatchSchema>;
        const updated = await updateManagedMerchantProfileById(userId, existing.id, body);
        await syncShopTenantFromMerchantProfile(userId, updated);
        scheduleExploreMapCacheInvalidation('shop.profile_map_cache');
        res.json({ data: serializeMerchantProfile(updated) });
      } catch (error) {
        next(error);
      }
    }
  );
};