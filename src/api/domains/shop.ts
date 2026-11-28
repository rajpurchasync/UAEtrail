import { ShopPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Public shop reads only — operator manage uses {@link publishingWorkspaceApi}. */
export const shopApi = {
  getShopMerchantPublic: (id: string) =>
    apiRequest<{ data: ShopPublicDTO }>(`/shop/merchants/${id}`),

  getShopPublic: (id: string) => apiRequest<{ data: ShopPublicDTO }>(`/shop/shops/${id}`),
} as const;