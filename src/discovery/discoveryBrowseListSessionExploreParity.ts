/**
 * B-UNIFY-03 — align explore map browse UI hydrate with list browse session when `list=1` on `/explore`.
 */
import { EXPLORE_MAP_PATH } from '../config/platform';
import type { ExploreBrowseUrlHydratedState } from '../explore/exploreBrowseUrlHydrate';
import { readDiscoveryBrowseListSession } from './discoveryBrowseListSessionRead';
import type { DiscoveryBrowseListSessionSnapshot } from './discoveryBrowseListSessionRead';

export const exploreMapListOverlayActive = (
  pathname: string,
  searchParams: URLSearchParams,
  isDesktop: boolean
): boolean => {
  if (pathname !== EXPLORE_MAP_PATH) return false;
  if (isDesktop) {
    return searchParams.get('list') === '1' || searchParams.get('view') === 'people';
  }
  return searchParams.get('list') === '1';
};

export const readDiscoveryBrowseListSessionForExploreOverlay = (
  pathname: string,
  searchParams: URLSearchParams
): DiscoveryBrowseListSessionSnapshot =>
  readDiscoveryBrowseListSession({
    pathname,
    searchParams,
    mapOverlay: true,
  });

export const mergeExploreHydrateWithListBrowseSession = (
  state: ExploreBrowseUrlHydratedState,
  pathname: string,
  searchParams: URLSearchParams,
  isDesktop: boolean
): ExploreBrowseUrlHydratedState => {
  if (!exploreMapListOverlayActive(pathname, searchParams, isDesktop)) return state;
  const session = readDiscoveryBrowseListSessionForExploreOverlay(pathname, searchParams);
  const { filters } = session;
  const nextPanel =
    session.listCat === 'venues' ? 'venues' : session.listCat === 'people' ? 'activities' : state.panel;

  return {
    ...state,
    panel: isDesktop && session.listCat === 'venues' ? 'venues' : nextPanel,
    query: filters.query,
    venueRegions: session.venueRegions,
    geoPath: session.geoPath,
    activityDatePreset: filters.activityDatePreset,
    priceFilter: filters.price,
    hasTrip: filters.hasTrip,
    facilityKinds: [...filters.facilityKinds],
    crewBrowseLane: filters.crewBrowseLane,
    crewPeopleFacet: filters.crewPeopleFacet,
    crewProfessionalKind: filters.crewProfessionalKind,
    tripMapTopics:
      filters.tripTopics.length > 0 ? [...filters.tripTopics] : state.tripMapTopics,
    placeMapTopics:
      filters.placeTopics.length > 0 ? [...filters.placeTopics] : state.placeMapTopics,
  };
};