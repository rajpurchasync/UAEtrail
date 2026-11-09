import { MerchantProfileDTO, ShopPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const shopApi = {
  getShopOrganisationStores: () =>
    apiRequest<{ data: MerchantProfileDTO[] }>('/shop/organisation/stores', { auth: true }),

  getShopOrganisationProfile: (shopId: string) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/organisation/profile?shopId=${encodeURIComponent(shopId)}`,
      { auth: true }
    ),

  createShopOrganisationProfile: (payload: {
    shopName: string;
    description?: string;
    logo?: string;
    websiteUrl?: string | null;
    contactEmail?: string;
    contactPhone?: string;
    region?: string | null;
  }) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/organisation/profile', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  updateShopOrganisationProfile: (
    shopId: string,
    payload: Partial<{
      shopName: string;
      description?: string;
      logo?: string;
      websiteUrl?: string | null;
      contactEmail?: string;
      contactPhone?: string;
      region?: string | null;
    }>
  ) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/organisation/profile?shopId=${encodeURIComponent(shopId)}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

  getShopPublic: (id: string) => apiRequest<{ data: ShopPublicDTO }>(`/shop/shops/${id}`),
} as const;
