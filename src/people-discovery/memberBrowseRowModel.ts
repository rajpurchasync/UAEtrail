import type {
  ExploreAvailablePersonDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoverySeekingRowDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { proMembershipPath } from '../config/routingCatalog';
import {
  EXPLORE_PEOPLE_BROWSE_EVERYONE_PRO_LOCK_LABEL,
  EXPLORE_PEOPLE_BROWSE_FRIEND_NO_OUTING_FOR_FILTER,
  peopleBrowseAvailabilityDateLine,
  peopleBrowseAvailabilitySentence,
  peopleBrowseGoingSentence,
} from '../content/explorePeopleBrowseCopy';
import { memberProfileLink } from '../member/memberProfileLink';
import { memberProfileRoleBadgeLabel } from '../member/memberProfileRoleBadge';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';
import { exploreMapItemPathFromSeekingRow } from '../explore/memberDiscoverySeekingRow';
import { explorePath } from '../explore/routing';
import type { PeopleBrowseMemberRowProps } from './panel/peopleBrowse/PeopleBrowseMemberRow';
import { availabilityKindLabels } from './panel/peopleBrowse/peopleBrowseAvailabilityKinds';

/** L1 projection for people-browse list rows (panel + list `listCat=people`). */
export type MemberBrowseRowVm = PeopleBrowseMemberRowProps & {
  key: string;
  userId: string;
};

export const filterDirectoryBrowseCards = (
  directory: MemberBrowseCardDTO[],
  friendsGoing: SocialPersonRowDTO[],
  hostsGoing: SocialPersonRowDTO[]
): MemberBrowseCardDTO[] => {
  const friendUserIds = new Set(friendsGoing.map((person) => person.userId));
  return directory.filter(
    (row) => !friendUserIds.has(row.id) && !hostsGoing.some((host) => host.userId === row.id)
  );
};

export const buildMemberBrowseRowFromAvailability = (
  person: ExploreAvailablePersonDTO
): MemberBrowseRowVm => {
  const labels = availabilityKindLabels(person.kinds);
  return {
    key: person.userId,
    userId: person.userId,
    profileHref: memberProfileLink(person.userId, 'available'),
    displayName: person.displayName,
    avatarUrl: person.avatarUrl ?? null,
    buddyHighlight: person.isBuddy,
    title: peopleBrowseAvailabilitySentence(person.displayName, labels, person.slots),
    dateLine: peopleBrowseAvailabilityDateLine(person.slots),
    titleClamp: 'wrap',
  };
};

export const buildMemberBrowseRowFromGoing = (person: SocialPersonRowDTO): MemberBrowseRowVm => {
  const hasTrip = Boolean(person.upcomingTrip);
  return {
    key: person.userId,
    userId: person.userId,
    profileHref: memberProfileLink(person.userId, 'friends'),
    displayName: person.displayName,
    avatarUrl: person.avatarUrl,
    buddyHighlight: true,
    title: hasTrip
      ? peopleBrowseGoingSentence(person.displayName, person.upcomingTrip)
      : person.displayName,
    location: hasTrip
      ? person.cityLabel
      : person.cityLabel ?? EXPLORE_PEOPLE_BROWSE_FRIEND_NO_OUTING_FOR_FILTER,
    titleClamp: 'line-clamp-2',
    actionHref:
      hasTrip && person.upcomingTrip
        ? explorePath({ pin: person.upcomingTrip.exploreItemId, list: true })
        : undefined,
  };
};

export type BuildDirectoryBrowseRowsInput = {
  directory: MemberBrowseCardDTO[];
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  quota: MemberDiscoveryQuotaDTO | null;
};

export const buildMemberBrowseRowsFromDirectory = (
  input: BuildDirectoryBrowseRowsInput
): MemberBrowseRowVm[] => {
  const directoryOnly = filterDirectoryBrowseCards(
    input.directory,
    input.friendsGoing,
    input.hostsGoing
  );
  const freePreviewLimit = input.quota?.limit ?? null;
  const capBrowseList = freePreviewLimit != null;

  return directoryOnly.map((card, index) => {
    const blocked = capBrowseList && index >= freePreviewLimit!;
    const location = card.city;
    const roleTitle = memberProfileRoleLabel(card.profileRoleLabel);
    const badgeLabel = memberProfileRoleBadgeLabel(card.profileRoleLabel);

    return {
      key: card.id,
      userId: card.id,
      profileHref: blocked
        ? proMembershipPath({ intent: 'discover-members' })
        : memberProfileLink(card.id, 'discover'),
      displayName: card.displayName,
      avatarUrl: card.avatarUrl,
      buddyHighlight: false,
      title: card.displayName,
      location,
      roleTitle,
      badge: { label: badgeLabel },
      footnote: blocked ? EXPLORE_PEOPLE_BROWSE_EVERYONE_PRO_LOCK_LABEL : null,
    };
  });
};

export const buildMemberBrowseRowFromSeeking = (
  row: MemberDiscoverySeekingRowDTO
): MemberBrowseRowVm => ({
  key: `${row.userId}:${row.exploreItemId}`,
  userId: row.userId,
  profileHref: memberProfileLink(row.userId, 'host'),
  actionHref: exploreMapItemPathFromSeekingRow(row),
  displayName: row.displayName,
  avatarUrl: row.avatarUrl,
  buddyHighlight: false,
  title: `Looking for: ${row.seekingTitle}`,
  titleClamp: 'line-clamp-2',
});
