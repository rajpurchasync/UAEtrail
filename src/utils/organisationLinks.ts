import {
  inferPublishingProfileKindFromTenantWire,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';

export {
  memberProfilePath,
  hostBrandProfilePath,
  inferPublishingProfileKindFromTenantWire,
} from '@uaetrail/shared-types';

/** Domain alias — prefer in new code. Same URL as memberProfilePath. */
export { memberProfilePath as personProfilePath } from '@uaetrail/shared-types';

export type TenantWireForPublicPath = {
  slug?: string | null;
  ownerId?: string | null;
  type?: string | null;
  businessMode?: string | null;
  publishingPurpose?: string | null;
};

/** Canonical public URL — `/member/:userId` for individuals; agency/shop/partner storefronts for businesses. */
export const tenantBrandPublicPath = (
  tenant: TenantWireForPublicPath,
  slugFallback?: string | null
): string | null => {
  const slug = tenant.slug?.trim() || slugFallback?.trim();
  const kind = inferPublishingProfileKindFromTenantWire(tenant);
  return resolveActivityPublisherProfilePath({
    publishingProfileKind: kind,
    tenantSlug: slug,
    hostUserId: tenant.ownerId,
  });
};
