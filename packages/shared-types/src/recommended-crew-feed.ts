import type { ExploreAvailablePersonDTO } from './member-availability.js';
import type { MemberDiscoveryQuotaDTO } from './member-discovery-quota.js';
import type { MemberBrowseCardDTO } from './member-pro-engagement.js';
import type { SocialPersonRowDTO } from './social-people.js';

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

export type RecommendedCrewFeedBucket = 'friends_going' | 'hosts_going' | 'availability' | 'directory';

export type RecommendedCrewFeedRowRef = {
  userId: string;
  bucket: RecommendedCrewFeedBucket;
  score: number;
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

/** Ordered user refs — friends → available → directory teaser; de-duped by user id. */
export const buildRecommendedCrewFeedRefs = (input: BuildRecommendedCrewFeedInput): RecommendedCrewFeedRowRef[] => {
  let scoreSeq = 10_000;
  const nextScore = (): number => {
    scoreSeq -= 1;
    return scoreSeq;
  };

  const caps = { ...DEFAULT_RECOMMENDED_CREW_FEED_CAPS, ...input.caps };
  const seen = new Set<string>();
  const rows: RecommendedCrewFeedRowRef[] = [];

  const pushUnique = (userId: string, bucket: RecommendedCrewFeedBucket) => {
    if (seen.has(userId)) return false;
    seen.add(userId);
    rows.push({ userId, bucket, score: nextScore() });
    return true;
  };

  let friendSlots = 0;
  for (const person of input.friendsGoing) {
    if (friendSlots >= caps.friends) break;
    if (pushUnique(person.userId, 'friends_going')) friendSlots += 1;
  }
  for (const person of input.hostsGoing) {
    if (friendSlots >= caps.friends) break;
    if (pushUnique(person.userId, 'hosts_going')) friendSlots += 1;
  }

  let availableSlots = 0;
  for (const person of input.availabilityPeople) {
    if (availableSlots >= caps.available) break;
    const before = seen.size;
    pushUnique(person.userId, 'availability');
    if (seen.size > before) availableSlots += 1;
  }

  const directoryOnly = filterDirectoryBrowseCards(
    input.directory,
    input.friendsGoing,
    input.hostsGoing
  );

  let directorySlots = 0;
  for (const card of directoryOnly) {
    if (directorySlots >= caps.directory) break;
    const before = seen.size;
    pushUnique(card.id, 'directory');
    if (seen.size > before) directorySlots += 1;
  }

  return rows;
};