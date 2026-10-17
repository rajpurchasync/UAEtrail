import { exploreMapPeekPath } from '@uaetrail/shared-types';
import type { ProductDTO, ShopPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { TenantProfile } from '../api/types';
import type { ShopPublicView } from '../components/shop/ShopPublicPage';
import { fetchOrganisationProfileBySlug } from './organisationConsoleApi';
import { fetchPublicPlaceDetail } from './placeDetailClientApi';
import { communityShopPlaceToView } from '../utils/communityShopPlace';

export type ShopProductDetailPayload = ProductDTO & {
  merchantId?: string;
  merchant?: { id: string; shopName: string; description?: string; logo?: string };
};

export const fetchShopPublic = async (id: string): Promise<ShopPublicDTO> => {
  const res = await api.getShopPublic(id);
  return res.data;
};

export const fetchShopProductDetail = async (productId: string): Promise<ShopProductDetailPayload> => {
  const res = await api.getShopProductDetail(productId);
  return res.data;
};

const resolvePresence = (latitude?: number | null, longitude?: number | null): ShopPublicView['presence'] =>
  latitude != null && longitude != null ? 'physical' : 'online';

const tenantToShopView = (tenant: TenantProfile): ShopPublicView => ({
  id: tenant.shopId ?? tenant.merchantId ?? tenant.slug,
  reviewTargetId: tenant.id,
  shopName: tenant.name,
  description: tenant.description ?? tenant.ownerBio ?? null,
  logo: null,
  websiteUrl: tenant.website ?? null,
  region: tenant.region ?? null,
  latitude: tenant.latitude ?? null,
  longitude: tenant.longitude ?? null,
  contactPersonName: tenant.ownerName ?? null,
  contactPersonUserId: tenant.ownerId ?? null,
  products: (tenant.shopProducts ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    priceAed: product.priceAed,
    discountPercent: product.discountPercent,
    externalUrl: null,
  })),
  presence: resolvePresence(tenant.latitude, tenant.longitude),
});

export type ShopPublicPageResult = {
  shop: ShopPublicView | null;
  communityPeekOnly: boolean;
};

/** Resolves merchant id, tenant slug, or community place id to a public shop page model. */
export const fetchShopPublicPage = async (id: string): Promise<ShopPublicPageResult> => {
  try {
    const merchant = await fetchShopPublic(id);
    return {
      communityPeekOnly: false,
      shop: {
        id: merchant.id,
        reviewTargetId: merchant.tenantId ?? null,
        shopName: merchant.shopName,
        description: merchant.description ?? null,
        logo: merchant.logo ?? null,
        websiteUrl: merchant.websiteUrl ?? null,
        region: merchant.region ?? null,
        latitude: merchant.latitude ?? null,
        longitude: merchant.longitude ?? null,
        contactEmail: merchant.contactEmail ?? null,
        contactPhone: merchant.contactPhone ?? null,
        contactPersonName: merchant.contactPersonName ?? null,
        contactPersonAvatar: merchant.contactPersonAvatar ?? null,
        contactPersonUserId: merchant.contactPersonUserId ?? null,
        products: merchant.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? null,
          images: product.images,
          priceAed: product.priceAed,
          discountPercent: product.discountPercent ?? null,
          externalUrl: product.externalUrl ?? null,
        })),
        presence: resolvePresence(merchant.latitude, merchant.longitude),
      },
    };
  } catch {
    try {
      const tenant = await fetchOrganisationProfileBySlug(id);
      return { communityPeekOnly: false, shop: tenantToShopView(tenant as TenantProfile) };
    } catch {
      try {
        const place = await fetchPublicPlaceDetail(id);
        const view = communityShopPlaceToView(place);
        if (view) {
          return { communityPeekOnly: true, shop: view };
        }
        return { communityPeekOnly: false, shop: null };
      } catch {
        return { communityPeekOnly: false, shop: null };
      }
    }
  }
};

export const shopPublicPeekRedirectPath = (venueId: string): string =>
  exploreMapPeekPath(`venue:${venueId}`, 'shops');
