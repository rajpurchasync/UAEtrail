import {
  hostBrandProfilePath,
  inferHostStorefrontKindFromTenantWire,
} from '@uaetrail/shared-types';

export {
  memberProfilePath,
  organisationProfilePath,
  resolveOrganisationProfilePath,
  hostBrandProfilePath,
  guideProfilePath,
  inferHostStorefrontKindFromTenantWire,
} from '@uaetrail/shared-types';

/** @deprecated Use organisationProfilePath */
export { organisationProfilePath as hostProfilePath } from '@uaetrail/shared-types';

/** Domain alias — prefer in new code. Same URL as memberProfilePath. */
export { memberProfilePath as personProfilePath } from '@uaetrail/shared-types';

/** @deprecated Use resolveOrganisationProfilePath */
export { resolveOrganisationProfilePath as resolveHostProfilePath } from '@uaetrail/shared-types';

export type TenantWireForPublicPath = {
  slug?: string | null;
  type?: string | null;
  businessMode?: string | null;
  publishingPurpose?: string | null;
};

/** Canonical public URL for a host tenant (guide · agency · partner · shop). */
export const tenantBrandPublicPath = (
  tenant: TenantWireForPublicPath,
  slugFallback?: string | null
): string | null => {
  const slug = tenant.slug?.trim() || slugFallback?.trim();
  if (!slug) return null;
  const kind = inferHostStorefrontKindFromTenantWire(tenant);
  return hostBrandProfilePath(slug, kind);
};
