import {
  discoveryModalitiesFromSlots,
  guideEngagementTermsBrowseLineFromSlots,
  memberHasGuideCapacityInSlots,
} from '@uaetrail/shared-types';
import type {
  ExploreAvailablePersonDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoveryAvailabilityRowDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { proMembershipPath } from '../config/routingCatalog';
import {
  EXPLORE_CREWS_EVERYONE_PRO_LOCK_LABEL,
  EXPLORE_CREWS_FRIEND_NO_OUTING_FOR_FILTER,
  crewBrowseAvailabilityDateLine,
  crewBrowseAvailabilitySentence,
  crewBrowseGoingSentence,
} from '../content/exploreCrewsCopy';
import { memberProfileLink } from '../member/memberProfileLink';
import { memberProfileRoleBadgeLabel } from '../member/memberProfileRoleBadge';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';
import { exploreMapItemPathFromAvailabilityRow } from '../explore/memberDiscoveryAvailabilityRow';
import { explorePath } from '../explore/routing';
import type { CrewBrowseMemberRowProps } from './panel/crewBrowse/CrewBrowseMemberRow';
import {
  availabilityKindLabels,
  scheduleModalityLabels,
} from './panel/crewBrowse/crewBrowseAvailabilityKinds';

/** L1 projection for people-browse list rows (panel + list `listCat=people`). */
export type MemberBrowseRowVm = CrewBrowseMemberRowProps & {
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

/** Guides lane — `capacity: guide` on slots (MIG-SG-B4). */
export const filterAvailabilityPeopleByGuideCapacity = (
  people: ExploreAvailablePersonDTO[],
  filter: 'all' | 'guide'
): ExploreAvailablePersonDTO[] =>
  filter === 'guide'
    ? people.filter((person) => memberHasGuideCapacityInSlots(person.slots ?? []))
    : people;

/** @deprecated Use `filterAvailabilityPeopleByGuideCapacity`. */
export const filterAvailabilityPeopleByGuideIntent = filterAvailabilityPeopleByGuideCapacity;

export const availabilityPersonShowsGuideCapacityBadge = (person: ExploreAvailablePersonDTO): boolean =>
  memberHasGuideCapacityInSlots(person.slots ?? []);

/** @deprecated Use `availabilityPersonShowsGuideCapacityBadge`. */
export const availabilityPersonShowsGuideIntentBadge = (kinds: readonly string[]): boolean =>
  kinds.includes('guide');

export const buildMemberBrowseRowFromAvailability = (
  person: ExploreAvailablePersonDTO
): MemberBrowseRowVm => {
  const modalityLabels = scheduleModalityLabels(discoveryModalitiesFromSlots(person.slots ?? []));
  const labels = modalityLabels.length
    ? modalityLabels
    : availabilityKindLabels(person.kinds.filter((k) => k !== 'guide'));
  const showGuideBadge = availabilityPersonShowsGuideCapacityBadge(person);
  const guideTermsLine = showGuideBadge
    ? guideEngagementTermsBrowseLineFromSlots(person.slots ?? [])
    : null;
  return {
    key: person.userId,
    userId: person.userId,
    profileHref: memberProfileLink(person.userId, 'available'),
    displayName: person.displayName,
    avatarUrl: person.avatarUrl ?? null,
    buddyHighlight: person.isBuddy,
    title: crewBrowseAvailabilitySentence(person.displayName, labels, person.slots),
    dateLine: crewBrowseAvailabilityDateLine(person.slots),
    titleClamp: 'wrap',
    badge: showGuideBadge ? { label: 'Guide' } : null,
    footnote: guideTermsLine,
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
      ? crewBrowseGoingSentence(person.displayName, person.upcomingTrip)
      : person.displayName,
    location: hasTrip
      ? person.cityLabel
      : person.cityLabel ?? EXPLORE_CREWS_FRIEND_NO_OUTING_FOR_FILTER,
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
      footnote: blocked ? EXPLORE_CREWS_EVERYONE_PRO_LOCK_LABEL : null,
    };
  });
};

export const buildMemberBrowseRowFromRosterAvailability = (
  row: MemberDiscoveryAvailabilityRowDTO
): MemberBrowseRowVm => ({
  key: `${row.userId}:${row.exploreItemId}`,
  userId: row.userId,
  profileHref: memberProfileLink(row.userId, 'host'),
  actionHref: exploreMapItemPathFromAvailabilityRow(row),
  displayName: row.displayName,
  avatarUrl: row.avatarUrl,
  buddyHighlight: false,
  title: `Available: ${row.availabilityTitle}`,
  titleClamp: 'line-clamp-2',
});
