import {
  CREW_BROWSE_LANE_LABELS,
  CREW_BROWSE_LANE_ORDER,
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  type CrewBrowseLane,
  type CrewBrowseState,
  type CrewPeopleFacet,
  parseCrewBrowseState,
  serializeCrewBrowseLane,
} from './crewBrowseState';

export type { CrewBrowseLane, CrewPeopleFacet, CrewBrowseState };
export {
  CREW_BROWSE_LANE_LABELS,
  CREW_BROWSE_LANE_ORDER,
  CREW_PEOPLE_FACET_LABELS,
  CREW_PEOPLE_FACET_ORDER,
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  PEOPLE_FACET_URL_PARAM,
  crewBrowseNeedsAvailability,
  crewBrowseNeedsRoster,
  crewBrowseOmitDirectory,
  crewDataLaneFromState,
  crewsCategoryMapFeedEnabled,
  parseCrewBrowseState,
  parseCrewPeopleFacet,
  serializeCrewBrowseLane,
  serializeCrewPeopleFacet,
} from './crewBrowseState';

/**
 * Find crew browse lanes (`peopleTab` wire).
 * People facet: `peopleFacet` param — default **Recommended** omitted.
 * Lane labels: people: 'People', professional: 'Professional', community: 'Community'.
 */
export type CrewBrowseTab = CrewBrowseLane;

export const CREW_BROWSE_TAB_ORDER = CREW_BROWSE_LANE_ORDER;
export const CREW_BROWSE_TAB_LABELS = CREW_BROWSE_LANE_LABELS;

/** @deprecated Use parseCrewBrowseState — returns lane only from URL tab param. */
export const parseCrewBrowseTab = (raw: string | null): CrewBrowseTab => {
  if (!raw || raw === 'hub' || raw === 'buddies') return DEFAULT_CREW_BROWSE_LANE;
  if (raw === 'people' || raw === 'professional' || raw === 'community') return raw;
  if (raw === 'available' || raw === 'going' || raw === 'connect' || raw === 'looking') {
    return 'people';
  }
  const params = new URLSearchParams();
  params.set('peopleTab', raw);
  return parseCrewBrowseState(params).lane;
};

/** URL `peopleTab` — omit default People lane. */
export const serializeCrewBrowseTab = (tab: CrewBrowseTab): string | null =>
  serializeCrewBrowseLane(tab);

export const defaultCrewBrowseState = (): CrewBrowseState => ({
  lane: DEFAULT_CREW_BROWSE_LANE,
  facet: DEFAULT_CREW_PEOPLE_FACET,
});