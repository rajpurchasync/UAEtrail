import {
  isOrganizeActivityHostProfileType,
  type OwnedHostProfileDTO,
  type PublishingProfileKind,
} from '@uaetrail/shared-types';

/** Host tenants eligible for map Organize (buddy / guide / agency — not shop-only). */
export const listOrganizePublishProfiles = (
  ownedProfiles: OwnedHostProfileDTO[]
): OwnedHostProfileDTO[] => ownedProfiles.filter((profile) => isOrganizeActivityHostProfileType(profile.type));

const fallbackPublishingKind = (profile: OwnedHostProfileDTO): PublishingProfileKind => {
  if (profile.type === 'agency') return 'agency';
  if (profile.type === 'shop') return 'shop';
  return 'community';
};

/** Product label for publish-as selector on the review step. */
export const organizePublishAsLabel = (
  profile: OwnedHostProfileDTO,
  memberDisplayName?: string | null
): string => {
  const kind = profile.publishingProfileKind ?? fallbackPublishingKind(profile);
  if (kind === 'community') {
    const name = memberDisplayName?.trim();
    return name ? `As ${name}` : 'As yourself';
  }
  return `As ${profile.name}`;
};
