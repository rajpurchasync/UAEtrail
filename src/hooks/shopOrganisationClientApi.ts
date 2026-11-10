import type { ShopOrganisationDTO } from '@uaetrail/shared-types';
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
    allowInboundChat?: boolean;
    showContactPhone?: boolean;
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
  allowInboundChat?: boolean;
  showContactPhone?: boolean;
}): Promise<ShopOrganisationDTO> => {
  const res = await api.createShopOrganisationProfile(payload);
  return res.data;
};
