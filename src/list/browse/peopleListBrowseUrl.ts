import {
  parseCrewBrowseState,
  PRO_KIND_URL_PARAM,
  serializeCrewBrowseLane,
  serializeCrewPeopleFacet,
  serializeCrewProfessionalKind,
  type CrewBrowseLane,
  type CrewBrowseState,
  type CrewPeopleFacet,
  PEOPLE_FACET_URL_PARAM,
} from '@/crew-discovery/crewBrowseState';
import { PEOPLE_LIST_TAB_URL_PARAM, readPeopleCrewsTabParam } from '../../routing/productUrlInbound';

export type CrewBrowseTab = CrewBrowseLane;
export type { CrewBrowseState, CrewPeopleFacet };

export { PEOPLE_LIST_TAB_URL_PARAM, PEOPLE_FACET_URL_PARAM, readPeopleCrewsTabParam };

/** Full-screen `/list?listCat=people` — default **People / Recommended** when tab params omitted. */
export const parsePeopleListBrowseState = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewBrowseState => parseCrewBrowseState(searchParams);

/** @deprecated Use parsePeopleListBrowseState */
export const parsePeopleListBrowseTab = (raw: string | null): CrewBrowseLane => {
  if (!raw) return 'people';
  const params = new URLSearchParams();
  params.set(PEOPLE_LIST_TAB_URL_PARAM, raw);
  return parseCrewBrowseState(params).lane;
};

export const parseExploreCrewBrowseState = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewBrowseState => parseCrewBrowseState(searchParams);

/** @deprecated Use parseExploreCrewBrowseState */
export const parseExploreCrewBrowseTab = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewBrowseLane => parseExploreCrewBrowseState(searchParams).lane;

export const serializePeopleListBrowseState = (state: CrewBrowseState): {
  peopleTab: string | null;
  peopleFacet: string | null;
  proKind: string | null;
} => ({
  peopleTab: serializeCrewBrowseLane(state.lane),
  peopleFacet: serializeCrewPeopleFacet(state.lane, state.facet),
  proKind: serializeCrewProfessionalKind(state.lane, state.proKind),
});

export { PRO_KIND_URL_PARAM };

/** @deprecated Use serializePeopleListBrowseState */
export const serializePeopleListBrowseTab = (tab: CrewBrowseLane): string | null =>
  serializeCrewBrowseLane(tab);