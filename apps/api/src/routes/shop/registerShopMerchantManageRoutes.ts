import type { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { scheduleExploreMapCacheInvalidation } from '../../lib/explore-map-cache-schedule.js';
import { requireAuth, requireVerifiedEmail } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createMerchantProfileForUser,
  syncShopTenantFromMerchantProfile,
  updateManagedMerchantProfileById,
} from '../../services/shop-merchant-commands.js';
import { listManagedMerchantProfiles, userCanCreateShopProfile } from '../../services/shop-merchant-read.js';
import {
  getManagedMerchantProfile,
  merchantProfilePatchSchema,
  merchantProfileSchema,
  serializeMerchantProfile,
  shopOrganisationManagePrefixes,
  shopScopeSchema,
  type ShopManageScope,
} from './shop-route-schemas.js';

/** Merchant + organisation manage (`/shop/merchant/*`, `/shop/organisation/*` profile aliases). */
export const registerShopMerchantManageRoutes = (router: Router): void => {
  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.get(`${prefix}/stores`, requireAuth, requireVerifiedEmail, async (req, res, next) => {
      try {
        const stores = await listManagedMerchantProfiles(req.auth!.userId);
        res.json({ data: stores.map(serializeMerchantProfile) });
      } catch (error) {
        next(error);
      }
    });
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.get(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ query: shopScopeSchema }),
      async (req, res, next) => {
        try {
          const scope = req.query as ShopManageScope;
          const profile = await getManagedMerchantProfile(req.auth!.userId, scope);
          if (!profile) throw new ApiError(404, 'profile_not_found', 'Shop profile not found. Create one first.');

          res.json({
            data: serializeMerchantProfile(profile),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.post(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ body: merchantProfileSchema }),
      async (req, res, next) => {
        try {
          const userId = req.auth!.userId;
          if (!(await userCanCreateShopProfile(userId, req.auth!.role))) {
            throw new ApiError(
              403,
              'forbidden',
              'Shop profiles are created when your host application is approved, or by a platform administrator.'
            );
          }
          const body = req.body as z.infer<typeof merchantProfileSchema>;
          const profile = await createMerchantProfileForUser(userId, body);
          await syncShopTenantFromMerchantProfile(userId, profile);

          res.status(201).json({
            data: serializeMerchantProfile(profile),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });

  shopOrganisationManagePrefixes.forEach((prefix) => {
    router.patch(
      `${prefix}/profile`,
      requireAuth,
      requireVerifiedEmail,
      validate({ query: shopScopeSchema, body: merchantProfilePatchSchema }),
      async (req, res, next) => {
        try {
          const userId = req.auth!.userId;
          const scope = req.query as ShopManageScope;
          const existing = await getManagedMerchantProfile(userId, scope);
          if (!existing) throw new ApiError(404, 'profile_not_found', 'Shop profile not found.');

          const body = req.body as z.infer<typeof merchantProfilePatchSchema>;
          const updated = await updateManagedMerchantProfileById(userId, existing.id, body);
          await syncShopTenantFromMerchantProfile(userId, updated);
          scheduleExploreMapCacheInvalidation('shop.profile_map_cache');

          res.json({
            data: serializeMerchantProfile(updated),
          });
        } catch (error) {
          next(error);
        }
      }
    );
  });
};
