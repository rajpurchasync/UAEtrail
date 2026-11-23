import type { DiscoverCrewRecommendationBucket } from '@uaetrail/shared-types';

const LABELS: Record<DiscoverCrewRecommendationBucket, string> = {
  friends_going: 'Friend going',
  hosts_going: 'Host you follow',
  availability: 'Free to join',
  directory: 'New to you',
};

export const crewRecommendationBucketLabel = (bucket: DiscoverCrewRecommendationBucket): string =>
  LABELS[bucket] ?? bucket;