import type { DiscoverCrewRecommendationBucket } from '@uaetrail/shared-types';
import { crewRecommendationBucketLabel } from '../../crewRecommendationBucketCopy';

export const CrewRecommendationBucketChip = ({
  bucket,
}: {
  bucket: DiscoverCrewRecommendationBucket;
}) => (
  <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200/80">
    {crewRecommendationBucketLabel(bucket)}
  </span>
);