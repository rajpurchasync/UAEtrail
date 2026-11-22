import type {
  ExploreAvailablePersonDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  type MemberBrowseRowVm,
} from './memberBrowseRowModel';

export type RecommendedCrewFeedCaps = {
  friends: number;
  available: number;
  directory: number;
};

export const DEFAULT_RECOMMENDED_CREW_FEED_CAPS: RecommendedCrewFeedCaps = {
  friends: 8,
  available: 12,
  directory: 3,
};

export type BuildRecommendedCrewFeedInput = {
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  availabilityPeople: ExploreAvailablePersonDTO[];
  directory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  caps?: Partial<RecommendedCrewFeedCaps>;
};

/** Client-side Recommended merge — friends → available → directory teaser; de-duped by user id. */
export const buildRecommendedCrewFeed = (input: BuildRecommendedCrewFeedInput): MemberBrowseRowVm[] => {
  const caps = { ...DEFAULT_RECOMMENDED_CREW_FEED_CAPS, ...input.caps };
  const seen = new Set<string>();
  const rows: MemberBrowseRowVm[] = [];

  const pushUnique = (row: MemberBrowseRowVm) => {
    if (seen.has(row.userId)) return;
    seen.add(row.userId);
    rows.push(row);
  };

  let friendSlots = 0;
  for (const person of input.friendsGoing) {
    if (friendSlots >= caps.friends) break;
    pushUnique(buildMemberBrowseRowFromGoing(person));
    friendSlots += 1;
  }
  for (const person of input.hostsGoing) {
    if (friendSlots >= caps.friends) break;
    pushUnique(buildMemberBrowseRowFromGoing(person));
    friendSlots += 1;
  }

  let availableSlots = 0;
  for (const person of input.availabilityPeople) {
    if (availableSlots >= caps.available) break;
    const before = seen.size;
    pushUnique(buildMemberBrowseRowFromAvailability(person));
    if (seen.size > before) availableSlots += 1;
  }

  const directoryRows = buildMemberBrowseRowsFromDirectory({
    directory: input.directory,
    friendsGoing: input.friendsGoing,
    hostsGoing: input.hostsGoing,
    quota: input.discoveryQuota,
  });

  let directorySlots = 0;
  for (const row of directoryRows) {
    if (directorySlots >= caps.directory) break;
    const before = seen.size;
    pushUnique(row);
    if (seen.size > before) directorySlots += 1;
  }

  return rows;
};