import type { ShopOperatorProfileDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchPublishingShopProfile = async (
  tenantId: string
): Promise<ShopOperatorProfileDTO | null> => {
  try {
    const res = await api.getPublishingShopProfile(tenantId);
    return res.data;
  } catch (error) {
    const err = error as Error & { status?: number; code?: string };
    if (err.status === 404 || err.code === 'profile_not_found') {
      return null;
    }
    throw error;
  }
};

export const createPublishingShopProfile = async (
  tenantId: string,
  payload: {
    shopName: string;
    description?: string;
    logo?: string;
    websiteUrl?: string | null;
    contactEmail?: string;
    contactPhone?: string;
    region?: string | null;
    allowInboundChat?: boolean;
    showContactPhone?: boolean;
  }
): Promise<ShopOperatorProfileDTO> => {
  const res = await api.createPublishingShopProfile(tenantId, payload);
  return res.data;
};

export const updatePublishingShopProfile = async (
  tenantId: string,
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
): Promise<ShopOperatorProfileDTO> => {
  const res = await api.updatePublishingShopProfile(tenantId, payload);
  return res.data;
};