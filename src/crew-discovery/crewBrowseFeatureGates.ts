import { FEATURE_FLAGS } from '@/config/platform';
import { CREW_BROWSE_LANE_ORDER, type CrewBrowseLane } from './crewBrowseState';

/** Top-level Find crew tabs shown in product UI (Community gated until API ships). */
export const crewBrowseLanesForProduct = (): CrewBrowseLane[] =>
  FEATURE_FLAGS.communityDiscover
    ? [...CREW_BROWSE_LANE_ORDER]
    : CREW_BROWSE_LANE_ORDER.filter((lane) => lane !== 'community');

/** Inbound `peopleTab=community` when feature is off still parses — UI lands on People. */
export const normalizeCrewBrowseLaneForProduct = (lane: CrewBrowseLane): CrewBrowseLane =>
  lane === 'community' && !FEATURE_FLAGS.communityDiscover ? 'people' : lane;