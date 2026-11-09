import { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import {
  findManagedMerchantProfileById,
  findMerchantProfileByTenantId,
  listManagedMerchantProfiles,
} from '../../services/shop-merchant-read.js';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const shopScopeSchema = z.object({
  merchantId: z.string().min(1).optional(),
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
  allowInboundChat: z.boolean().optional(),
  showContactPhone: z.boolean().optional(),
});

export const merchantProfilePatchSchema = merchantProfileSchema.partial();

/** Live dual prefixes — `/organisation/*` stays next to `/merchant/*` (not a leftover file). */
export const shopOrganisationManagePrefixes = ['/merchant', '/organisation'] as const;

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
  allowInboundChat?: boolean;
  showContactPhone?: boolean;
}) => ({
  id: profile.id,
  shopId: profile.id,
  merchantId: profile.id,
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
  allowInboundChat: profile.allowInboundChat === true,
  showContactPhone: profile.showContactPhone === true,
});

export const serializeMerchantPublicProfile = (
  profile: Parameters<typeof serializeMerchantProfile>[0] & {
    contactPersonName?: string | null;
    contactPersonAvatar?: string | null;
    contactPersonUserId?: string | null;
  }
) => {
  const owner = serializeMerchantProfile(profile);
  return {
    ...owner,
    contactPhone: owner.showContactPhone ? owner.contactPhone : null,
    contactPersonName: profile.contactPersonName ?? null,
    contactPersonAvatar: profile.contactPersonAvatar ?? null,
    contactPersonUserId: profile.contactPersonUserId ?? null,
  };
};

export async function getManagedMerchantProfile(userId: string, scope?: ShopManageScope | string) {
  const resolvedScope: ShopManageScope = typeof scope === 'string' ? { merchantId: scope } : (scope ?? {});
  const merchantKey = resolvedScope.merchantId ?? resolvedScope.shopId;

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
