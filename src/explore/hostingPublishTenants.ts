import {
  isOrganizeActivityHostProfileType,
  type OwnedHostProfileDTO,
  type PublishingProfileKind,
} from '@uaetrail/shared-types';

/** Host tenants eligible for map Host / publish (buddy / guide / agency / verified shop). */
export const listHostingPublishProfiles = (
  ownedProfiles: OwnedHostProfileDTO[]
): OwnedHostProfileDTO[] => ownedProfiles.filter((profile) => isOrganizeActivityHostProfileType(profile.type));

export const resolveHostingPublishingProfileKind = (profile: OwnedHostProfileDTO): PublishingProfileKind => {
  if (profile.publishingProfileKind) return profile.publishingProfileKind;
  if (profile.type === 'agency') return 'agency';
  if (profile.type === 'shop') return 'shop';
  return 'community';
};

/** Product label for publish-as selector on the review step. */
export const hostingPublishAsLabel = (
  profile: OwnedHostProfileDTO,
  memberDisplayName?: string | null
): string => {
  const kind = resolveHostingPublishingProfileKind(profile);
  if (kind === 'community') {
    const name = memberDisplayName?.trim();
    return name ? `As ${name}` : 'As yourself';
  }
  return `As ${profile.name}`;
};
