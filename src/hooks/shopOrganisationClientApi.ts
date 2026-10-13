import type { ProductDTO, ShopOrganisationDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchShopOrganisationStores = async (): Promise<ShopOrganisationDTO[]> => {
  const res = await api.getShopOrganisationStores();
  return res.data;
};

export const fetchShopOrganisationProfile = async (
  shopId: string
): Promise<ShopOrganisationDTO> => {
  const res = await api.getShopOrganisationProfile(shopId);
  return res.data;
};

export const fetchShopOrganisationProducts = async (
  shopId: string
): Promise<(ProductDTO & { createdAt?: string })[]> => {
  const res = await api.getShopOrganisationProducts(shopId);
  return res.data;
};

export const updateShopOrganisationProfile = async (
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
): Promise<void> => {
  await api.updateShopOrganisationProfile(shopId, payload);
};

export const createShopOrganisationProfile = async (payload: {
  shopName: string;
  description?: string;
  logo?: string;
  websiteUrl?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  region?: string | null;
}): Promise<ShopOrganisationDTO> => {
  const res = await api.createShopOrganisationProfile(payload);
  return res.data;
};

export const updateShopOrganisationProduct = async (
  productId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  await api.updateShopOrganisationProduct(productId, payload);
};

export const addShopOrganisationProduct = async (
  payload: Record<string, unknown>
): Promise<void> => {
  await api.addShopOrganisationProduct(payload);
};

export const deleteShopOrganisationProduct = async (productId: string): Promise<void> => {
  await api.deleteShopOrganisationProduct(productId);
};
