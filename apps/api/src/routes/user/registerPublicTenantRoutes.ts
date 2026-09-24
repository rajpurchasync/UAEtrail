import type { Router } from 'express';
import { TenantBusinessMode } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { findPublicTenantProfileBySlug } from '../../lib/activities-store.js';
import { loadHostDetailsForUser } from '../../lib/host-display-details.js';
import { buildActivityDto, mapTenantBusinessMode, mapTenantType } from '../../lib/mappers.js';
import { findMerchantProfilesByUserIds, findMerchantPublicById } from '../../lib/shop-store.js';

/** Public organisation/operator profile by slug (`/operator/:slug` alias). */
export const registerPublicTenantRoutes = (router: Router): void => {
  router.get('/tenants/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      const tenant = await findPublicTenantProfileBySlug(slug);
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Host not found.');
      }
      const ownerProfile = tenant.owner.profile;
      const hostDetails = await loadHostDetailsForUser(tenant.ownerId);

      let merchantId: string | null = null;
      let shopProducts: Array<{
        id: string;
        name: string;
        description: string | null;
        images: string[];
        priceAed: number;
        discountPercent: number | null;
      }> = [];

      const isShopTenant = tenant.businessMode === TenantBusinessMode.SHOP;

      if (isShopTenant && tenant.ownerId) {
        const merchant = (await findMerchantProfilesByUserIds([tenant.ownerId])).get(tenant.ownerId) ?? null;
        if (merchant) {
          merchantId = merchant.id;
          const publicMerchant = await findMerchantPublicById(merchant.id);
          shopProducts =
            publicMerchant?.products.map((product) => ({
              id: product.id,
              name: product.name,
              description: product.description ?? null,
              images: product.images,
              priceAed: product.priceAed,
              discountPercent: product.discountPercent ?? null,
            })) ?? [];
        }
      }

      res.json({
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: mapTenantType(tenant.type),
          businessMode: mapTenantBusinessMode(tenant.businessMode),
          description: tenant.description ?? null,
          website: tenant.website ?? null,
          region: tenant.region ?? null,
          latitude: tenant.latitude ?? null,
          longitude: tenant.longitude ?? null,
          ownerId: tenant.ownerId,
          ownerName: ownerProfile?.displayName ?? tenant.owner.email,
          ownerAvatar: ownerProfile?.avatarUrl ?? null,
          ownerBio: ownerProfile?.bio ?? null,
          hostDetails,
          shopId: merchantId,
          shopProducts,
          memberCount: tenant.memberships.length,
          team: tenant.memberships.map((m) => ({
            role: m.role,
            displayName: m.user.profile?.displayName ?? m.user.email,
            avatarUrl: m.user.profile?.avatarUrl ?? null,
          })),
          activities: tenant.activities.map((activity) => buildActivityDto(activity)),
        },
      });
    } catch (error) {
      next(error);
    }
  });
};
