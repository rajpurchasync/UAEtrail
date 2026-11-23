import {
  buildRecommendedCrewFeedRefs,
  DEFAULT_RECOMMENDED_CREW_FEED_CAPS,
  DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION,
  type AvailabilityKind,
  type DiscoverCrewRecommendationRowDTO,
  type DiscoverCrewRecommendationsDTO,
} from '@uaetrail/shared-types';
import { addDaysIso, todayIso } from '../lib/explore-activity-date-filter.js';
import { loadExplorePeopleAvailability } from './explore-availability-read.js';
import { loadMemberDiscoveryRoster } from './member-discovery-roster.js';

const CREW_LIMIT_MAX = 25;

export const loadDiscoverCrewRecommendations = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  limit?: number;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  datePresetRaw?: string | null;
  areaSlug?: string | null;
  kind?: AvailabilityKind | null;
}): Promise<DiscoverCrewRecommendationsDTO> => {
  const from = input.rangeStart?.trim() || todayIso();
  const to = input.rangeEnd?.trim() || addDaysIso(todayIso(), 13);
  const limit = Math.min(Math.max(input.limit ?? CREW_LIMIT_MAX, 1), CREW_LIMIT_MAX);

  const caps = {
    ...DEFAULT_RECOMMENDED_CREW_FEED_CAPS,
    friends: Math.min(DEFAULT_RECOMMENDED_CREW_FEED_CAPS.friends, limit),
    available: Math.min(DEFAULT_RECOMMENDED_CREW_FEED_CAPS.available, limit),
    directory: Math.min(DEFAULT_RECOMMENDED_CREW_FEED_CAPS.directory, limit),
  };

  const [roster, availability] = await Promise.all([
    loadMemberDiscoveryRoster({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
      datePresetRaw: input.datePresetRaw,
      skip: 0,
      take: 80,
      omitDirectory: false,
    }),
    loadExplorePeopleAvailability({
      viewerUserId: input.viewerUserId,
      rangeStart: from,
      rangeEnd: to,
      kind: input.kind ?? null,
      areaSlug: input.areaSlug ?? null,
      friendsOnly: false,
    }),
  ]);

  const refs = buildRecommendedCrewFeedRefs({
    friendsGoing: roster.data.friendsGoing,
    hostsGoing: roster.data.hostsGoing,
    availabilityPeople: availability.people,
    directory: roster.data.directory,
    discoveryQuota: roster.quota,
    caps,
  }).slice(0, limit);

  const rows: DiscoverCrewRecommendationRowDTO[] = refs.map((ref) => ({
    userId: ref.userId,
    bucket: ref.bucket,
    score: ref.score,
  }));

  return {
    schemaVersion: DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION,
    surface: 'crew',
    rows,
  };
};