/**
 * Canonical route builders for application code.
 * Prefer importing paths from here instead of string literals in components.
 *
 * @see docs/DOMAIN_CANONICALS.md
 */
export {
  EXPLORE_MAP_PATH,
  EXPLORE_DISCOVER_BROWSE_PATH,
  LIST_DISCOVERY_PATH,
  PARTICIPANT_JOIN_REDIRECT,
  joinAuthPath,
  ADMIN_PLACES_PATH,
  HOST_PLACES_PATH,
  ORGANISATION_PUBLIC_PATH_PREFIX,
  LEGACY_OPERATOR_PUBLIC_PATH_PREFIX,
  DOMAIN_GLOSSARY,
} from './platform';

export {
  PRO_MEMBERSHIP_PATH,
  LEGACY_BECOME_HOST_PATH,
  proMembershipPath,
  proMembershipAnchorPath,
} from './memberRoutes';

export {
  PROFILE_PATH,
  PROFILE_EDIT_PATH,
  PROFILE_REVIEWS_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_BADGES_PATH,
  COMMUNITY_PATH,
  MEMBERSHIP_MARKETING_PATH,
  GROUPS_PATH,
  groupsPath,
  groupsManagePath,
  NOTIFICATIONS_PATH,
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  CHAT_PATH,
  MESSAGES_PATH,
  LEGACY_MESSAGES_PATH,
  HOST_MESSAGES_PATH,
  MY_REQUESTS_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_ACTIVITIES_NEW_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_TEAM_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_SECURITY_PRIVACY_PATH,
  rewriteLegacyPublishingConsolePath,
  isPublishingConsolePath,
  operatorActivitiesCheckInPath,
  HOST_OVERVIEW_PATH,
  HOST_ACTIVITIES_PATH,
  HOST_ACTIVITIES_NEW_PATH,
  HOST_REQUESTS_PATH,
  HOST_TEAM_PATH,
  HOST_PROFILE_PATH,
  HOST_HISTORY_PATH,
  SIGNIN_PATH,
  SIGNUP_PATH,
  WELCOME_PATH,
  VERIFY_PATH,
  FORGOT_PASSWORD_PATH,
  signInPath,
  hostActivitiesCheckInPath,
  messagesToUserPath,
  messagesGroupPath,
  myRequestDetailPath,
  LEGACY_TRAIL_POINTS_PATH,
  LEGACY_MY_REWARDS_PATH,
  LEGACY_REWARDS_PATH,
  isLegacyRewardsWalletPath,
  PROFILE_HISTORY_PATH,
  JOURNEY_MAP_PATH,
  MY_TRIPS_PATH,
  MY_TRIPS_MAP_PATH,
  isProfileHistoryListPath,
  isJourneyMapPath,
} from './surfacePaths';

export {
  ADMIN_OVERVIEW_PATH,
  ADMIN_USERS_PATH,
  ADMIN_HOSTS_PATH,
  ADMIN_ACTIVITIES_PATH,
  ADMIN_GROUPS_PATH,
  ADMIN_SHOP_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_AREAS_PATH,
} from './adminSurfacePaths';

export {
  ORGANISATION_MANAGE_PATH,
  organisationManagePath,
  parseOrganisationKind,
  type OrganisationKind,
} from '../member/organisationPaths';

export {
  PLAN_PATH,
  TRIPS_PATH,
  ACTIVITIES_PATH,
  HOST_CONSOLE_LINKS,
  ADMIN_LINKS,
} from '../constants';

export {
  placeDetailPath,
  activityDetailPath,
  activityDetailInvitePath,
  exploreActivityInvitePath,
  organisationProfilePath,
  hostBrandProfilePath,
  guideProfilePath,
  agencyProfilePath,
  partnerProfilePath,
  VENUE_PLACE_PATH_PREFIX,
  memberProfilePath,
  shopPublicPath,
  resolveEntityPath,
  resolveOrganisationProfilePath,
  parseEntityRefFromPathname,
  exploreDemandMapItemPath,
  exploreSeekingMapItemPath,
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
  explorePeopleBrowsePath,
  exploreDiscoverBrowsePath,
  explorePlanWithBuddyPath,
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
  listDiscoveryPath,
  exploreMapPathFromListSearch,
  listDiscoveryPathFromExploreSearch,
} from '../list/routing';

export {
  tripsPath,
  tripsPlansPath,
  tripsCompletedPath,
  tripsMapPath,
  myTripsWishlistPath,
  tripsLegacyJoinedTabPath,
  tripsLegacyUpcomingSegmentPath,
} from '../member-plan/tripsRouting';
