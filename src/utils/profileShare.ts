import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';

export interface ProfileShareOptions {
  referralCode?: string | null;
  fallbackPath?: string;
}

/** Best public URL for sharing this member's profile. */
export const resolveProfileSharePath = (
  ownedProfiles: OwnedHostProfileDTO[],
  options: ProfileShareOptions = {}
): string => {
  const agency = ownedProfiles.find((profile) => profile.type === 'agency' && profile.slug);
  if (agency) return `/operator/${agency.slug}`;

  const guide = ownedProfiles.find((profile) => profile.type === 'guide' && profile.slug);
  if (guide) return `/operator/${guide.slug}`;

  const shop = ownedProfiles.find((profile) => profile.type === 'shop' && profile.slug);
  if (shop) return `/merchant/${shop.slug}`;

  const referralCode = options.referralCode?.trim();
  if (referralCode) return `/signup?ref=${encodeURIComponent(referralCode)}`;

  return options.fallbackPath ?? '/activities';
};

export const resolveProfileShareText = (
  displayName: string,
  ownedProfiles: OwnedHostProfileDTO[]
): string => {
  if (ownedProfiles.some((profile) => profile.type === 'agency' || profile.type === 'guide')) {
    return `Check out ${displayName} on UAE Trail — hikes, camps, and outdoor trips in the UAE.`;
  }
  if (ownedProfiles.some((profile) => profile.type === 'shop')) {
    return `Visit ${displayName} on UAE Trail — outdoor gear and adventure shops in the UAE.`;
  }
  return `${displayName} on UAE Trail — find hikes, camps, and outdoor activities across the UAE.`;
};
