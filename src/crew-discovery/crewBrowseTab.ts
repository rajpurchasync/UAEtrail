import {
  CREW_BROWSE_LANE_LABELS,
  CREW_BROWSE_LANE_ORDER,
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  DEFAULT_CREW_PROFESSIONAL_KIND,
  type CrewBrowseLane,
  type CrewProfessionalKind,
  type CrewBrowseState,
  type CrewPeopleFacet,
  serializeCrewBrowseLane,
} from './crewBrowseState';

export type { CrewBrowseLane, CrewPeopleFacet, CrewProfessionalKind, CrewBrowseState };
export {
  CREW_BROWSE_LANE_LABELS,
  CREW_BROWSE_LANE_ORDER,
  CREW_PEOPLE_FACET_LABELS,
  CREW_PEOPLE_FACET_ORDER,
  CREW_PROFESSIONAL_KIND_LABELS,
  CREW_PROFESSIONAL_KIND_ORDER,
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  DEFAULT_CREW_PROFESSIONAL_KIND,
  PEOPLE_FACET_URL_PARAM,
  PRO_KIND_URL_PARAM,
  parseCrewBrowseState,
  parseCrewProfessionalKind,
  serializeCrewProfessionalKind,
  crewBrowseNeedsAvailability,
  crewBrowseNeedsRoster,
  crewBrowseOmitDirectory,
  crewDataLaneFromState,
  crewsCategoryMapFeedEnabled,  parseCrewPeopleFacet,
  serializeCrewBrowseLane,
  serializeCrewPeopleFacet,
} from './crewBrowseState';

/**
 * Find crew browse lanes (`peopleTab` wire).
 * Default lane **Recommended** omitted; `peopleTab=people` selects People.
 * People facet: `peopleFacet` param — default **Friends** omitted.
 */
export type CrewBrowseTab = CrewBrowseLane;

export const CREW_BROWSE_TAB_ORDER = CREW_BROWSE_LANE_ORDER;
export const CREW_BROWSE_TAB_LABELS = CREW_BROWSE_LANE_LABELS;

/** URL `peopleTab` — omit default Recommended lane. */
export const serializeCrewBrowseTab = (tab: CrewBrowseTab): string | null =>
  serializeCrewBrowseLane(tab);

export const defaultCrewBrowseState = (): CrewBrowseState => ({
  lane: DEFAULT_CREW_BROWSE_LANE,
  facet: DEFAULT_CREW_PEOPLE_FACET,
  proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
});