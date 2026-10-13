import type { ProductDTO, ShopPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

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
