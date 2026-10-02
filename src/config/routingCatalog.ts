/**
 * Canonical route builders for application code.
 * Prefer importing paths from here instead of string literals in components.
 *
 * @see docs/DOMAIN_CANONICALS.md
 */
export {
  EXPLORE_MAP_PATH,
  PARTICIPANT_JOIN_REDIRECT,
  joinAuthPath,
  ADMIN_PLACES_PATH,
  HOST_PLACES_PATH,
  ORGANISATION_PUBLIC_PATH_PREFIX,
  DOMAIN_GLOSSARY,
} from './platform';

export {
  PRO_MEMBERSHIP_PATH,
  LEGACY_BECOME_HOST_PATH,
  proMembershipPath,
} from './memberRoutes';

export {
  PROFILE_PATH,
  PROFILE_BADGES_PATH,
  COMMUNITY_PATH,
  MEMBERSHIP_MARKETING_PATH,
  GROUPS_PATH,
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  LEGACY_TRAIL_POINTS_PATH,
  LEGACY_MY_REWARDS_PATH,
  LEGACY_REWARDS_PATH,
  isLegacyRewardsWalletPath,
} from './surfacePaths';

export { TRIPS_PATH, ACTIVITIES_PATH, HOST_CONSOLE_LINKS, ADMIN_LINKS } from '../constants';

export {
  placeDetailPath,
  activityDetailPath,
  organisationProfilePath,
  memberProfilePath,
  shopPublicPath,
  resolveEntityPath,
  resolveOrganisationProfilePath,
  parseEntityRefFromPathname,
  exploreDemandMapItemPath,
  EXPLORE_SHOPS_PATH,
  EXPLORE_SHOPS_LIST_PATH,
  type EntityRef,
  type EntityKind,
  type PlaceVenueKind,
} from '@uaetrail/shared-types';

export {
  explorePath,
  exploreSavedPinPath,
  explorePlacesPath,
  exploreShopsPath,
  exploreActivitiesPath,
  exploreOrganizePath,
  detailBackPath,
  myActivitiesPath,
  legacyCreateParamToOrganizePath,
  parseActivityListFilter,
  discoveryToExploreSearch,
  type ExplorePanel,
  type MapFilterKey,
  type ActivityListFilterKey,
  type VenueListFilterKey,
  type DetailBackKind,
} from '../explore/routing';

export {
  tripsPlansPath,
  tripsCompletedPath,
  tripsMapPath,
  tripsLegacyJoinedTabPath,
  tripsLegacyUpcomingSegmentPath,
} from '../trips/tripsRouting';
