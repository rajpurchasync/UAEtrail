import type {
  ExploreAvailablePersonDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import {
  buildRecommendedCrewFeedRefs,
  DEFAULT_RECOMMENDED_CREW_FEED_CAPS,
  type BuildRecommendedCrewFeedInput,
  type RecommendedCrewFeedCaps,
} from '@uaetrail/shared-types';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  type MemberBrowseRowVm,
} from './memberBrowseRowModel';

export type { BuildRecommendedCrewFeedInput, RecommendedCrewFeedCaps };
export { DEFAULT_RECOMMENDED_CREW_FEED_CAPS };

/** Client-side Recommended merge — server parity via `buildRecommendedCrewFeedRefs`. */
export const buildRecommendedCrewFeed = (input: BuildRecommendedCrewFeedInput): MemberBrowseRowVm[] => {
  const refs = buildRecommendedCrewFeedRefs(input);
  if (refs.length === 0) return [];

  const friendMap = new Map<string, SocialPersonRowDTO>();
  for (const person of input.friendsGoing) friendMap.set(person.userId, person);
  for (const person of input.hostsGoing) friendMap.set(person.userId, person);

  const availabilityMap = new Map(input.availabilityPeople.map((person) => [person.userId, person]));
  const directoryMap = new Map(input.directory.map((card) => [card.id, card]));

  const directoryRows = buildMemberBrowseRowsFromDirectory({
    directory: input.directory,
    friendsGoing: input.friendsGoing,
    hostsGoing: input.hostsGoing,
    quota: input.discoveryQuota,
  });
  const directoryVmMap = new Map(directoryRows.map((row) => [row.userId, row]));

  const rows: MemberBrowseRowVm[] = [];
  for (const ref of refs) {
    if (ref.bucket === 'friends_going' || ref.bucket === 'hosts_going') {
      const person = friendMap.get(ref.userId);
      if (person) rows.push(buildMemberBrowseRowFromGoing(person));
      continue;
    }
    if (ref.bucket === 'availability') {
      const person = availabilityMap.get(ref.userId);
      if (person) rows.push(buildMemberBrowseRowFromAvailability(person));
      continue;
    }
    const directoryRow = directoryVmMap.get(ref.userId);
    if (directoryRow) rows.push(directoryRow);
  }

  return rows;
};