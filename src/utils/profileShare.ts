import type { OwnedOrganisationProfileDTO } from '@uaetrail/shared-types';
import {
  agencyProfilePath,
  guideProfilePath,
  shopPublicPath,
  tripsLegacyJoinedTabPath,
} from '../config/routingCatalog';

export interface ProfileShareOptions {
  referralCode?: string | null;
  fallbackPath?: string;
}

/** Best public URL for sharing this member's profile. */
export const resolveProfileSharePath = (
  ownedProfiles: OwnedOrganisationProfileDTO[],
  options: ProfileShareOptions = {}
): string => {
  const agency = ownedProfiles.find((profile) => profile.type === 'agency' && profile.slug);
  const agencyPath = agencyProfilePath(agency?.slug);
  if (agencyPath) return agencyPath;

  const guide = ownedProfiles.find((profile) => profile.type === 'guide' && profile.slug);
  const guidePath = guideProfilePath(guide?.slug);
  if (guidePath) return guidePath;

  const shop = ownedProfiles.find((profile) => profile.type === 'shop' && profile.slug);
  if (shop?.slug) {
    return shopPublicPath({ slug: shop.slug });
  }

  const referralCode = options.referralCode?.trim();
  if (referralCode) return `/signup?ref=${encodeURIComponent(referralCode)}`;

  return options.fallbackPath ?? tripsLegacyJoinedTabPath();
};

export const resolveProfileShareText = (
  displayName: string,
  ownedProfiles: OwnedOrganisationProfileDTO[]
): string => {
  if (ownedProfiles.some((profile) => profile.type === 'agency' || profile.type === 'guide')) {
    return `Check out ${displayName} on UAE Trail — hikes, camps, and outdoor activities in the UAE.`;
  }
  if (ownedProfiles.some((profile) => profile.type === 'shop')) {
    return `Check out ${displayName}'s shop on UAE Trail — outdoor gear and picks in the UAE.`;
  }
  return `Join ${displayName} on UAE Trail — find your crew and get outside together in the UAE.`;
};
