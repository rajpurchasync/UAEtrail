import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import {
  findManagedMerchantProfileById,
  findMerchantProfileByTenantId,
  listManagedMerchantProfiles,
} from '../../services/shop-merchant-read.js';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const shopScopeSchema = z.object({
  shopId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
});

export type ShopManageScope = z.infer<typeof shopScopeSchema>;

export const merchantProfileSchema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  websiteUrl: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  region: z.string().max(80).optional().nullable(),
});

export const merchantProfilePatchSchema = merchantProfileSchema.partial();

/** Shop manage routes. Mongo collection stays `merchant_profiles`. */
export const shopManagePrefix = '/organisation' as const;

export const serializeMerchantProfile = (profile: {
  id: string;
  tenantId?: string | null;
  shopName: string;
  description: string | null;
  logo: string | null;
  websiteUrl?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
}) => ({
  id: profile.id,
  shopId: profile.id,
  tenantId: profile.tenantId ?? null,
  shopName: profile.shopName,
  description: profile.description,
  logo: profile.logo,
  websiteUrl: profile.websiteUrl ?? null,
  contactEmail: profile.contactEmail,
  contactPhone: profile.contactPhone,
  latitude: profile.latitude ?? null,
  longitude: profile.longitude ?? null,
  region: profile.region ?? null,
});

export async function getManagedMerchantProfile(userId: string, scope?: ShopManageScope) {
  const resolvedScope: ShopManageScope = scope ?? {};
  const merchantKey = resolvedScope.shopId;

  if (merchantKey) {
    const profile = await findManagedMerchantProfileById(userId, merchantKey);
    if (!profile) {
      throw new ApiError(403, 'forbidden', 'You are not authorized to manage this store.');
    }
    return profile;
  }

  if (resolvedScope.tenantId) {
    const linked = await findMerchantProfileByTenantId(resolvedScope.tenantId);
    if (!linked) return null;
    const profile = await findManagedMerchantProfileById(userId, linked.id);
    if (!profile) {
      throw new ApiError(403, 'forbidden', 'You are not authorized to manage this store.');
    }
    return profile;
  }

  const profiles = await listManagedMerchantProfiles(userId);
  return profiles[0] ?? null;
}
