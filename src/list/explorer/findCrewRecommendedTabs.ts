import type { CrewBrowseLane } from '@/crew-discovery/crewBrowseState';
import { FEATURE_FLAGS } from '@/config/platform';

export type FindCrewRecommendedTab = Extract<CrewBrowseLane, 'people' | 'community' | 'trips'>;

export const FIND_CREW_RECOMMENDED_TABS: ReadonlyArray<{ lane: FindCrewRecommendedTab; label: string }> =
  FEATURE_FLAGS.communityDiscover
    ? [
        { lane: 'people', label: 'People' },
        { lane: 'community', label: 'Groups' },
        { lane: 'trips', label: 'Trips' },
      ]
    : [
        { lane: 'people', label: 'People' },
        { lane: 'trips', label: 'Trips' },
      ];

export const normalizeFindCrewRecommendedLane = (lane: CrewBrowseLane): FindCrewRecommendedTab => {
  if (lane === 'community' && FEATURE_FLAGS.communityDiscover) return 'community';
  if (lane === 'trips') return 'trips';
  return 'people';
};