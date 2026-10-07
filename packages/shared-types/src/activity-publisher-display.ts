import type { HostPersonNameInput } from './host-display.js';
import {
  isRolePlaceholderDisplayName,
  resolveHostPersonDisplayName,
} from './host-display.js';
import { hostBrandProfilePath, memberProfilePath, shopPublicPath } from './entity-path.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';

/** Map Organize “publish as yourself” — person name + member profile; no storefront page. */
export const publishesActivityAsIndividual = (kind: PublishingProfileKind): boolean =>
  kind === 'community';

/** Consumer subtitle under publisher name on cards and list feed. */
export const exploreActivityPublisherTypeLabel = (
  kind: PublishingProfileKind | null | undefined
): string => {
  if (!kind || publishesActivityAsIndividual(kind)) return 'Host';
  switch (kind) {
    case 'pro_guide':
      return 'Guide';
    case 'agency':
      return 'Agency';
    case 'shop':
      return 'Shop';
    case 'ecommerce':
      return 'Online shop';
    case 'hospitality':
      return 'Hospitality';
    case 'partner':
      return 'Partner';
    default:
      return 'Host';
  }
};

/** Public name on explore/list for an activity row. */
export const resolveActivityPublisherDisplayName = (input: {
  publishingProfileKind: PublishingProfileKind;
  tenantName: string;
  person: HostPersonNameInput;
}): string => {
  const tenant = input.tenantName?.trim();
  if (!publishesActivityAsIndividual(input.publishingProfileKind)) {
    if (tenant && !isRolePlaceholderDisplayName(tenant)) return tenant;
  }
  return resolveHostPersonDisplayName(input.person) ?? 'Host';
};

/** Where the publisher row should link — never treat a person as an “organisation” surface. */
export const resolveActivityPublisherProfilePath = (input: {
  publishingProfileKind: PublishingProfileKind;
  tenantSlug?: string | null;
  hostUserId?: string | null;
}): string | null => {
  if (publishesActivityAsIndividual(input.publishingProfileKind)) {
    return memberProfilePath(input.hostUserId);
  }
  if (input.publishingProfileKind === 'shop' || input.publishingProfileKind === 'ecommerce') {
    return shopPublicPath({ slug: input.tenantSlug });
  }
  return hostBrandProfilePath(input.tenantSlug, input.publishingProfileKind);
};
