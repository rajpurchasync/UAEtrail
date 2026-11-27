import { MerchantProfileDTO, ShopPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Shop manage + public profile — client emits `/shop/merchant/*`. Server still accepts the organisation inbound alias. */
export const shopApi = {
  getShopOrganisationStores: () =>
    apiRequest<{ data: MerchantProfileDTO[] }>('/shop/merchant/stores', { auth: true }),

  getShopOrganisationProfile: (shopId: string) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/merchant/profile?shopId=${encodeURIComponent(shopId)}`,
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
    allowInboundChat?: boolean;
    showContactPhone?: boolean;
  }) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', {
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
      allowInboundChat?: boolean;
      showContactPhone?: boolean;
    }>
  ) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/merchant/profile?shopId=${encodeURIComponent(shopId)}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

  getShopOrganisationPublic: (id: string) =>
    apiRequest<{ data: ShopPublicDTO }>(`/shop/merchants/${id}`),

  getShopPublic: (id: string) => apiRequest<{ data: ShopPublicDTO }>(`/shop/shops/${id}`),
} as const;