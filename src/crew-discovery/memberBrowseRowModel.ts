import {
  filterDirectoryBrowseCards,
  guideEngagementTermsBrowseLineFromSlots,
  isFixedAvailabilitySlot,
  isOpenAvailabilitySlot,
  memberHasGuideCapacityInSlots,
} from '@uaetrail/shared-types';
import {
  EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL,
  EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
} from '../content/exploreCrewsCopy';
import type { ExploreActivityDatePreset } from '../discovery/discoveryPortExploreOptionalFilters';
import {
  availabilityMatchesFindCrewSearchDates,
  crewBrowseAvailabilityDetailFromPerson,
  crewBrowseAvailabilityLocationLabel,
  crewBrowseAvailabilitySocialLabel,
} from './availabilityBrowseCardCopy';
export { sortAvailabilityPeopleNetworkFirst } from './availabilityBrowseCardCopy';
import type { CrewsAvailabilityShapeFilter } from '../discovery/discoveryPortListFindCrew';
import type {
  DiscoverCrewRecommendationBucket,
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
  crewBrowseGoingSentence,
} from '../content/exploreCrewsCopy';
import { memberProfileLink } from '../member/memberProfileLink';
import { memberProfileRoleBadgeLabel } from '../member/memberProfileRoleBadge';
import { memberProfileRoleLabel } from '../member/memberProfileRoleLabel';
import { exploreMapItemPathFromAvailabilityRow } from '../discovery/discoveryPortExploreMapClient';
import { explorePath } from '../discovery/discoveryPortExploreRouting';
import { findCrewAvailabilityNarrativeFromDetail } from './findCrewAvailabilityNarrative';
import { findCrewProposePlanPath, pickProposePlanAnchorSlot } from '../discovery/discoveryPortListBrowseCard';
import type { CrewBrowseMemberRowProps } from './panel/crewBrowse/CrewBrowseMemberRow';
/** L1 projection for people-browse list rows (panel + list `listCat=people`). */
export type MemberBrowseRowVm = CrewBrowseMemberRowProps & {
  key: string;
  userId: string;
  recommendationBucket?: DiscoverCrewRecommendationBucket;
};

export { filterDirectoryBrowseCards } from '@uaetrail/shared-types';

/** Available tab — slot `capacity: guide` filter (MIG-SG-B4). */
export const filterAvailabilityByCapacity = (
  people: ExploreAvailablePersonDTO[],
  filter: 'all' | 'guide'
): ExploreAvailablePersonDTO[] =>
  filter === 'guide'
    ? people.filter((person) => memberHasGuideCapacityInSlots(person.slots ?? []))
    : people;

export const availabilityPersonShowsGuideCapacityBadge = (person: ExploreAvailablePersonDTO): boolean =>
  memberHasGuideCapacityInSlots(person.slots ?? []);

export const availabilityShapeLabelForPerson = (person: ExploreAvailablePersonDTO): string | null => {
  const slots = person.slots ?? [];
  const hasOpen = slots.some(isOpenAvailabilitySlot);
  const hasFixed = slots.some(isFixedAvailabilitySlot);
  if (hasOpen && hasFixed) {
    return `${EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL} · ${EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL}`;
  }
  if (hasFixed) return EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL;
  if (hasOpen) return EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL;
  return null;
};

export const filterAvailabilityPeopleByShape = (
  people: ExploreAvailablePersonDTO[],
  shape: CrewsAvailabilityShapeFilter
): ExploreAvailablePersonDTO[] => {
  if (shape === 'all') return people;
  return people.filter((person) => {
    const slots = person.slots ?? [];
    if (shape === 'flexible') return slots.some(isOpenAvailabilitySlot);
    return slots.some(isFixedAvailabilitySlot);
  });
};

export type BuildMemberBrowseAvailabilityRowOptions = {
  followedUserIds?: ReadonlySet<string>;
  findCrewDiscovery?: boolean;
  activityDatePreset?: ExploreActivityDatePreset;
};

export const buildMemberBrowseRowFromAvailability = (
  person: ExploreAvailablePersonDTO,
  options?: BuildMemberBrowseAvailabilityRowOptions
): MemberBrowseRowVm => {
  const slots = person.slots ?? [];
  const showGuideBadge = availabilityPersonShowsGuideCapacityBadge(person);
  const guideTermsLine = showGuideBadge
    ? guideEngagementTermsBrowseLineFromSlots(slots)
    : null;
  const availabilityDetail = crewBrowseAvailabilityDetailFromPerson(person);
  const findCrew = Boolean(options?.findCrewDiscovery);
  const findCrewNarrative =
    findCrew && availabilityDetail
      ? findCrewAvailabilityNarrativeFromDetail(availabilityDetail, slots)
      : undefined;
  const modalities = slots.flatMap((slot) => slot.modalities ?? []);
  const proposePlanAnchorSlot = findCrew
    ? pickProposePlanAnchorSlot(slots, options?.activityDatePreset)
    : null;
  return {
    key: person.userId,
    userId: person.userId,
    profileHref: memberProfileLink(person.userId, 'available'),
    displayName: person.displayName,
    avatarUrl: person.avatarUrl ?? null,
    friendHighlight: person.isFriend,
    socialLabel: crewBrowseAvailabilitySocialLabel(person, options?.followedUserIds),
    title: person.displayName,
    location: crewBrowseAvailabilityLocationLabel(person),
    availabilityDetail,
    findCrewNarrative,
    proposePlanHref: findCrew
      ? findCrewProposePlanPath(person.userId, {
          modalities,
          availabilitySlotId: proposePlanAnchorSlot?.slotId ?? null,
        })
      : undefined,
    proposePlanAnchorSlot: findCrew ? proposePlanAnchorSlot : undefined,
    rowPresentation: findCrew ? 'findCrew' : 'default',
    canMessage: options?.findCrewDiscovery ? person.isFriend : false,
    canOpenMemberProfile: person.canOpenMemberProfile !== false,
    matchesSearchDates:
      options?.findCrewDiscovery && options.activityDatePreset
        ? availabilityMatchesFindCrewSearchDates(slots, options.activityDatePreset)
        : false,
    roleTitle: options?.findCrewDiscovery
      ? memberProfileRoleLabel(person.profileRoleLabel)
      : undefined,
    titleClamp: 'truncate',
    footnote: findCrew ? null : showGuideBadge ? guideTermsLine : null,
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
    friendHighlight: true,
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
      friendHighlight: false,
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
  friendHighlight: false,
  title: `Available: ${row.availabilityTitle}`,
  titleClamp: 'line-clamp-2',
});
