import { MerchantProfileDTO, MerchantPublicDTO, ShopPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const shopApi = {
  getMerchantProfile: () =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', { auth: true }),

  getShopOrganisationStores: () =>
    apiRequest<{ data: MerchantProfileDTO[] }>('/shop/organisation/stores', { auth: true }),

  getMerchantStores: () =>
    apiRequest<{ data: MerchantProfileDTO[] }>('/shop/merchant/stores', { auth: true }),

  getShopOrganisationProfile: (shopId: string) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/organisation/profile?shopId=${encodeURIComponent(shopId)}`,
      { auth: true }
    ),

  getShopOrganisationProfileById: (merchantId: string) =>
    apiRequest<{ data: MerchantProfileDTO }>(
      `/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`,
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
    apiRequest<{ data: MerchantProfileDTO }>('/shop/organisation/profile', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createMerchantProfile: (payload: {
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
      `/shop/organisation/profile?shopId=${encodeURIComponent(shopId)}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

  updateMerchantProfile: (
    merchantId: string,
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
      `/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

  getShopOrganisationPublic: (id: string) =>
    apiRequest<{ data: MerchantPublicDTO }>(`/shop/merchants/${id}`),

  getShopPublic: (id: string) => apiRequest<{ data: ShopPublicDTO }>(`/shop/shops/${id}`),
} as const;
