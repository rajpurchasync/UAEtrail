import { exploreMapPeekPath } from '@uaetrail/shared-types';
import type { ShopPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { TenantPublicDTO } from '@uaetrail/shared-types';
import type { ShopPublicView } from '../components/shop/ShopPublicPage';
import { fetchOrganisationProfileBySlug } from './operatorDeskClientApi';
import { fetchPublicPlaceDetail } from './placeDetailClientApi';
import { communityShopPlaceToView } from '../utils/communityShopPlace';

export const fetchShopPublic = async (id: string): Promise<ShopPublicDTO> => {
  const res = await api.getShopPublic(id);
  return res.data;
};

const resolvePresence = (latitude?: number | null, longitude?: number | null): ShopPublicView['presence'] =>
  latitude != null && longitude != null ? 'physical' : 'online';

const tenantToShopView = (tenant: TenantPublicDTO): ShopPublicView => ({
  id: tenant.shopId ?? tenant.slug,
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
  presence: resolvePresence(tenant.latitude, tenant.longitude),
});

export type ShopPublicPageResult = {
  shop: ShopPublicView | null;
  communityPeekOnly: boolean;
};

/** Resolves shop profile id, tenant slug, or community place id to a public shop page model. */
export const fetchShopPublicPage = async (id: string): Promise<ShopPublicPageResult> => {
  try {
    const profile = await fetchShopPublic(id);
    return {
      communityPeekOnly: false,
      shop: {
        id: profile.id,
        reviewTargetId: profile.tenantId ?? null,
        shopName: profile.shopName,
        description: profile.description ?? null,
        logo: profile.logo ?? null,
        websiteUrl: profile.websiteUrl ?? null,
        region: profile.region ?? null,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        contactEmail: profile.contactEmail ?? null,
        contactPhone: profile.contactPhone ?? null,
        contactPersonName: profile.contactPersonName ?? null,
        contactPersonAvatar: profile.contactPersonAvatar ?? null,
        contactPersonUserId: profile.contactPersonUserId ?? null,
        allowInboundChat: profile.allowInboundChat === true,
        presence: resolvePresence(profile.latitude, profile.longitude),
      },
    };
  } catch {
    try {
      const tenant = await fetchOrganisationProfileBySlug(id);
      return { communityPeekOnly: false, shop: tenantToShopView(tenant as TenantPublicDTO) };
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
