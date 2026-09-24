import {
  MerchantAnalyticsInterval,
  MerchantAnalyticsSeriesDTO,
  MerchantOrderLineItemDTO,
  MerchantProfileDTO,
  MerchantPublicDTO,
  OrderStatus,
  ProductDTO,
  ShopPublicDTO,
} from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile } from '../client';

export const shopApi = {
    getCheckoutConfig: () => apiRequest<{ data: { stripeEnabled: boolean } }>('/shop/checkout/config'),

    createCheckoutSession: (payload: {
    productId?: string;
    quantity?: number;
    items?: Array<{ productId: string; quantity: number }>;
    includeVat?: boolean;
  }) =>
    apiRequest<{ data: { sessionId: string; url: string | null } }>('/shop/checkout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    getShopProducts: (filters?: { category?: string; search?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: ProductDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/shop/products${qs ? `?${qs}` : ''}`,
      {}
    );
  },

    getShopProductDetail: (id: string) =>
    apiRequest<{ data: ProductDTO & { merchant: { id: string; shopName: string; description?: string; logo?: string } } }>(
      `/shop/products/${id}`,
      {}
    ),

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
    apiRequest<{ data: MerchantProfileDTO }>(`/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`, { auth: true }),

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
      body: JSON.stringify(payload)
    }),

    createMerchantProfile: (payload: {
    shopName: string;
    description?: string;
    logo?: string;
    websiteUrl?: string | null;
    contactEmail?: string;
    contactPhone?: string;
    region?: string | null;
  }) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
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
    apiRequest<{ data: MerchantProfileDTO }>(`/shop/organisation/profile?shopId=${encodeURIComponent(shopId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

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
    }>
  ) =>
    apiRequest<{ data: MerchantProfileDTO }>(`/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    getShopOrganisationProducts: (shopId: string) =>
    apiRequest<{ data: (ProductDTO & { createdAt: string })[] }>(
      `/shop/merchant/products?shopId=${encodeURIComponent(shopId)}`,
      { auth: true }
    ),

    addShopOrganisationProduct: (payload: {
    shopId: string;
    name: string;
    description?: string;
    images?: string[];
    priceAed: number;
    stockQuantity: number;
    lowStockThreshold: number;
    discountPercent?: number;
    externalUrl?: string | null;
    packagingInfo?: string;
    category: string;
    status?: 'draft' | 'active';
  }) =>
    apiRequest<{ data: ProductDTO }>('/shop/merchant/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    addMerchantProduct: (payload: { merchantId: string; name: string; description?: string; images?: string[]; priceAed: number; stockQuantity: number; lowStockThreshold: number; discountPercent?: number; externalUrl?: string | null; packagingInfo?: string; category: string; status?: 'draft' | 'active' }) =>
    apiRequest<{ data: ProductDTO }>('/shop/merchant/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    updateShopOrganisationProduct: (id: string, payload: Partial<{ name: string; description?: string; images?: string[]; priceAed: number; stockQuantity: number; lowStockThreshold: number; discountPercent?: number; packagingInfo?: string; category: string; status?: 'draft' | 'active' }>) =>
    apiRequest<{ data: ProductDTO }>(`/shop/merchant/products/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    deleteShopOrganisationProduct: (id: string) =>
    apiRequest(`/shop/merchant/products/${id}`, {
      method: 'DELETE',
      auth: true
    }),

    getMerchantAnalytics: (filters: { merchantId: string; startDate: string; endDate: string; interval: MerchantAnalyticsInterval }) => {
    const params = new URLSearchParams({
      merchantId: filters.merchantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      interval: filters.interval
    });
    return apiRequest<{ data: MerchantAnalyticsSeriesDTO }>(`/shop/merchant/analytics/sales?${params.toString()}`, {
      auth: true
    });
  },

    downloadMerchantAnalyticsReport: (filters: { merchantId: string; startDate: string; endDate: string; interval: MerchantAnalyticsInterval }) => {
    const params = new URLSearchParams({
      merchantId: filters.merchantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      interval: filters.interval
    });
    return downloadAuthenticatedFile(`/shop/merchant/analytics/export?${params.toString()}`);
  },

    getMerchantOrders: (filters: { merchantId: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams({ merchantId: filters.merchantId });
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    return apiRequest<{ data: MerchantOrderLineItemDTO[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/shop/merchant/orders?${params.toString()}`,
      { auth: true }
    );
  },

    updateMerchantOrderStatus: (orderId: string, payload: { status: OrderStatus; fulfillmentTrackingLink?: string }) =>
    apiRequest<{ data: MerchantOrderLineItemDTO }>(`/shop/merchant/orders/${orderId}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    getShopOrganisationPublic: (id: string) =>
    apiRequest<{ data: MerchantPublicDTO }>(`/shop/merchants/${id}`),

    getShopPublic: (id: string) =>
    apiRequest<{ data: ShopPublicDTO }>(`/shop/shops/${id}`)
} as const;
