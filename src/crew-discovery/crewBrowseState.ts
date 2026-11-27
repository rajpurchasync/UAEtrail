import { readPeopleCrewsTabParam } from '@/routing/productUrlInbound';

/** Top-level Find crew tabs (People · Professional · Community · Trips). */
export type CrewBrowseLane = 'people' | 'professional' | 'community' | 'trips';

/**
 * People lane URL facets. **Find crew** UI exposes only `available` · `everyone` (see `findCrewPeopleFacets.ts`).
 * **Friends** wire is legacy/inbound only — maps to `available` on Find crew; friends UX lives on **My crew**.
 */
export type CrewPeopleFacet = 'recommended' | 'friends' | 'active' | 'available' | 'everyone';

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

export const CREW_BROWSE_LANE_ORDER: CrewBrowseLane[] = [
  'people',
  'professional',
  'community',
  'trips',
];

export const CREW_BROWSE_LANE_LABELS: Record<CrewBrowseLane, string> = {
  people: 'People',
  professional: 'Professional',
  community: 'Community',
  trips: 'Trips',
};

/** @deprecated Find crew UI order — use `FIND_CREW_PEOPLE_STAT_ORDER`. */
export const CREW_PEOPLE_FACET_ORDER: CrewPeopleFacet[] = ['available', 'everyone'];

export const CREW_PEOPLE_FACET_LABELS: Record<CrewPeopleFacet, string> = {
  recommended: 'Available',
  friends: 'Available',
  active: 'Active now',
  available: 'Available',
  everyone: 'Everyone',
};

export const DEFAULT_CREW_BROWSE_LANE: CrewBrowseLane = 'people';
export const DEFAULT_CREW_PEOPLE_FACET: CrewPeopleFacet = 'available';

export const parseCrewProfessionalKind = (raw: string | null): CrewProfessionalKind => {
  if (raw === 'guide' || raw === 'porter' || raw === 'agency' || raw === 'all') return raw;
  return DEFAULT_CREW_PROFESSIONAL_KIND;
};

export const parseCrewPeopleFacet = (raw: string | null): CrewPeopleFacet => {
  if (raw === 'active' || raw === 'available' || raw === 'everyone') return raw;
  if (raw === 'friends' || raw === 'recommended') return DEFAULT_CREW_PEOPLE_FACET;
  return DEFAULT_CREW_PEOPLE_FACET;
};

const inboundPeopleTabToFacet = (rawTab: string): CrewPeopleFacet | null => {
  if (rawTab === 'available') return 'available';
  if (rawTab === 'everyone' || rawTab === 'connect') return 'everyone';
  if (rawTab === 'friends' || rawTab === 'going') return DEFAULT_CREW_PEOPLE_FACET;
  return null;
};

const normalizeBrowseLane = (rawTab: string | null): CrewBrowseLane | null => {
  if (rawTab === 'people') return 'people';
  if (rawTab === 'professional' || rawTab === 'community' || rawTab === 'trips') return rawTab;
  if (rawTab === 'recommended') return 'people';
  return null;
};

/** Parse lane + facet from explore/list URL params. */
export const parseCrewBrowseState = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewBrowseState => {
  const rawTab = readPeopleCrewsTabParam(searchParams);
  const facetRaw = searchParams.get(PEOPLE_FACET_URL_PARAM)?.trim() ?? null;
  const proKindRaw = searchParams.get(PRO_KIND_URL_PARAM)?.trim() ?? null;
  const proKind = parseCrewProfessionalKind(proKindRaw);

  const laneFromTab = normalizeBrowseLane(rawTab);
  if (laneFromTab === 'professional' || laneFromTab === 'community' || laneFromTab === 'trips') {
    return {
      lane: laneFromTab,
      facet: DEFAULT_CREW_PEOPLE_FACET,
      proKind: laneFromTab === 'professional' ? proKind : DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  if (laneFromTab === 'people' || rawTab === 'recommended') {
    return {
      lane: 'people',
      facet: parseCrewPeopleFacet(facetRaw),
      proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  if (rawTab !== null) {
    const inboundFacet = inboundPeopleTabToFacet(rawTab);
    if (inboundFacet) {
      return {
        lane: 'people',
        facet: inboundFacet,
        proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
      };
    }
  }

  if (rawTab === null) {
    return {
      lane: DEFAULT_CREW_BROWSE_LANE,
      facet: parseCrewPeopleFacet(facetRaw),
      proKind: DEFAULT_CREW_PROFESSIONAL_KIND,
    };
  }

  return {
    lane: DEFAULT_CREW_BROWSE_LANE,
    facet: DEFAULT_CREW_PEOPLE_FACET,
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
  lane === DEFAULT_CREW_BROWSE_LANE ? null : lane;

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
    case 'recommended':
      return 'available';
    case 'active':
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
  if (state.lane === 'community' || state.lane === 'trips') return false;
  return true;
};

export const crewBrowseNeedsAvailability = (state: CrewBrowseState): boolean => {
  if (state.lane !== 'people') return false;
  return state.facet === 'available';
};

export const crewBrowseOmitDirectory = (state: CrewBrowseState): boolean => {
  if (state.lane === 'professional') return false;
  if (state.lane === 'community') return true;
  if (state.facet === 'everyone') return false;
  return true;
};

export const crewsCategoryMapFeedEnabled = (
  state: CrewBrowseState,
  availabilityShape: 'all' | 'flexible' | 'fixed'
): boolean => {
  if (state.lane === 'professional') return true;
  if (state.lane !== 'people') return false;
  if (state.facet !== 'available') return false;
  return availabilityShape === 'all' || availabilityShape === 'fixed';
};