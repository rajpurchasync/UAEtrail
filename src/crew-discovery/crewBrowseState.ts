import { readPeopleCrewsTabParam } from '@/routing/productUrlInbound';

/** Top-level Find crew tabs (People · Professional · Community). */
export type CrewBrowseLane = 'people' | 'professional' | 'community';

/** People tab facets — default Recommended. */
export type CrewPeopleFacet = 'recommended' | 'friends' | 'available' | 'everyone';

/** Legacy list content lanes (member-discovery APIs). */
export type CrewDataLane = 'available' | 'going' | 'connect';

/** Professional lane sub-filter (`proKind` URL param). */
export type CrewProfessionalKind = 'all' | 'guide' | 'porter' | 'agency';

export type CrewBrowseState = {
  lane: CrewBrowseLane;
  facet: CrewPeopleFacet;
  proKind: CrewProfessionalKind;
};

export const PEOPLE_FACET_URL_PARAM = 'peopleFacet';
export const PRO_KIND_URL_PARAM = 'proKind';

export const CREW_PROFESSIONAL_KIND_ORDER: CrewProfessionalKind[] = ['all', 'guide', 'porter', 'agency'];

export const CREW_PROFESSIONAL_KIND_LABELS: Record<CrewProfessionalKind, string> = {
  all: 'All',
  guide: 'Guides',
  porter: 'Porters',
  agency: 'Operators',
};

export const DEFAULT_CREW_PROFESSIONAL_KIND: CrewProfessionalKind = 'all';

export const CREW_BROWSE_LANE_ORDER: CrewBrowseLane[] = ['people', 'professional', 'community'];

export const CREW_BROWSE_LANE_LABELS: Record<CrewBrowseLane, string> = {
  people: 'People',
  professional: 'Professional',
  community: 'Community',
};

export const CREW_PEOPLE_FACET_ORDER: CrewPeopleFacet[] = [
  'recommended',
  'friends',
  'available',
  'everyone',
];

export const CREW_PEOPLE_FACET_LABELS: Record<CrewPeopleFacet, string> = {
  recommended: 'Recommended',
  friends: 'Friends',
  available: 'Available',
  everyone: 'Everyone',
};

export const DEFAULT_CREW_BROWSE_LANE: CrewBrowseLane = 'people';
export const DEFAULT_CREW_PEOPLE_FACET: CrewPeopleFacet = 'recommended';

export const parseCrewProfessionalKind = (raw: string | null): CrewProfessionalKind => {
  if (raw === 'guide' || raw === 'porter' || raw === 'agency' || raw === 'all') return raw;
  return DEFAULT_CREW_PROFESSIONAL_KIND;
};

export const parseCrewPeopleFacet = (raw: string | null): CrewPeopleFacet => {
  if (raw === 'friends' || raw === 'available' || raw === 'everyone' || raw === 'recommended') {
    return raw;
  }
  return DEFAULT_CREW_PEOPLE_FACET;
};

/** Parse lane + facet from explore/list URL params. */
export const parseCrewBrowseState = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewBrowseState => {
  const rawTab = readPeopleCrewsTabParam(searchParams);
  const facetRaw = searchParams.get(PEOPLE_FACET_URL_PARAM)?.trim() ?? null;
  const proKindRaw = searchParams.get(PRO_KIND_URL_PARAM)?.trim() ?? null;
  const proKind = parseCrewProfessionalKind(proKindRaw);

  if (rawTab === null) {
    return {
      lane: DEFAULT_CREW_BROWSE_LANE,
      facet: parseCrewPeopleFacet(facetRaw),
      proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  if (rawTab === 'people') {
    return {
      lane: 'people',
      facet: parseCrewPeopleFacet(facetRaw),
      proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  if (rawTab === 'professional' || rawTab === 'community') {
    return {
      lane: rawTab,
      facet: DEFAULT_CREW_PEOPLE_FACET,
      proKind: rawTab === 'professional' ? proKind : DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  return {
    lane: DEFAULT_CREW_BROWSE_LANE,
    facet: parseCrewPeopleFacet(facetRaw),
    proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
  };
};

export const serializeCrewProfessionalKind = (
  lane: CrewBrowseLane,
  proKind: CrewProfessionalKind
): string | null => {
  if (lane !== 'professional') return null;
  return proKind === DEFAULT_CREW_PROFESSIONAL_KIND ? null : proKind;
};

export const serializeCrewBrowseLane = (lane: CrewBrowseLane): string | null =>
  lane === 'people' ? null : lane;

export const serializeCrewPeopleFacet = (
  lane: CrewBrowseLane,
  facet: CrewPeopleFacet
): string | null => {
  if (lane !== 'people') return null;
  return facet === DEFAULT_CREW_PEOPLE_FACET ? null : facet;
};

export const crewDataLaneFromState = (state: CrewBrowseState): CrewDataLane | null => {
  if (state.lane !== 'people') return null;
  switch (state.facet) {
    case 'friends':
      return 'going';
    case 'available':
      return 'available';
    case 'everyone':
      return 'connect';
    default:
      return null;
  }
};

export const crewBrowseNeedsRoster = (state: CrewBrowseState): boolean => {
  if (state.lane === 'professional') return true;
  if (state.lane === 'community') return false;
  return true;
};

export const crewBrowseNeedsAvailability = (state: CrewBrowseState): boolean => {
  if (state.lane !== 'people') return false;
  return state.facet === 'recommended' || state.facet === 'available';
};

export const crewBrowseOmitDirectory = (state: CrewBrowseState): boolean => {
  if (state.lane === 'professional') return false;
  if (state.lane === 'community') return true;
  if (state.facet === 'everyone' || state.facet === 'recommended') return false;
  return true;
};

export const crewsCategoryMapFeedEnabled = (
  state: CrewBrowseState,
  crewsOpenLens: 'all' | 'open' | 'marked'
): boolean => {
  if (state.lane === 'professional') return true;
  if (state.lane !== 'people') return false;
  if (state.facet !== 'available' && state.facet !== 'recommended') return false;
  return crewsOpenLens === 'all' || crewsOpenLens === 'open';
};

export const filterCrewsProfessionalAgencyItems = <T extends { source: string }>(
  items: readonly T[]
): T[] => items.filter((item) => item.source === 'agency');