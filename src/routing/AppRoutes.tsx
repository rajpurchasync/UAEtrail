import { Suspense } from 'react';
import { Route, Routes, Navigate, type Location } from 'react-router-dom';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/routingCatalogLite';
import { COMMUNITY_CLUB_PATH_PREFIX } from '../config/routingCatalog';
import { EXPLORE_SEARCH_RESULTS_PATH } from '../explore/search/exploreSearchRouting';
import {
  INBOUND_CONTRIBUTIONS_PATH,
  INBOUND_MY_REWARDS_PATH,
  INBOUND_REWARDS_PATH,
  INBOUND_TRAIL_POINTS_PATH,
  MEMBERSHIP_MARKETING_PATH,
  HOSTING_HUB_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_SUBMISSIONS_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
  APP_SETTINGS_SAFETY_PATH,
  NOTIFICATIONS_PATH,
  NOTIFICATIONS_SAVED_PATH,
  NOTIFICATIONS_SETTINGS_PATH,
  INBOUND_PROFILE_SETTINGS_PATH,
  INBOUND_PROFILE_SETTINGS_ACCOUNT_PATH,
  INBOUND_PROFILE_SETTINGS_PRIVACY_PATH,
  INBOUND_PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  INBOUND_PROFILE_SETTINGS_SAFETY_PATH,
  OPERATOR_ACTIVITIES_NEW_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_SECURITY_PRIVACY_PATH,
  OPERATOR_TEAM_PATH,
  SIGNIN_PATH,
  SIGNUP_PATH,
  BUDDIES_PATH,
} from '../config/surfacePaths';
import {
  INBOUND_BECOME_HOST_PATH,
  INBOUND_BECOME_ORGANIZER_PATH,
  INBOUND_LEGACY_BUDDIES_PATH,
} from '../config/inboundRoutePaths';
import {
  INBOUND_JOURNEY_MAP_ALIAS_PATH,
  INBOUND_PROFILE_HISTORY_ALIAS_PATH,
} from '../config/inboundBookmarkPaths';
import { ProtectedRoute, Home, ExploreExperience, ExploreSearchResultsPage, ExploreInboundHubRedirect, BrowseListPage, DiscoveryRedirect, InboundCanonicalPlaceRedirect, InboundMerchantPublicRedirect, InboundProductPathRedirect, InboundMessagesRedirect, InboundProMembershipRedirect, InboundProfileWishlistRedirect, InboundRetiredPublishingConsoleRedirect, InboundProfileHistoryAliasRedirect, InboundJourneyMapAliasRedirect, InboundLegacyProfileSettingsRedirect, InboundLegacyNotificationsRedirect, InboundLegacyBuddiesRedirect, ShopBrowseRoute, CalendarRedirect, PeopleRedirect, PlanBrowseRoute, CanonicalPlaceDetailPage, VenuePlaceDetailPage, FacilityDetailPage, ProfileProMembership, ShopPublic, ActivityDetail, ActivityCrewPage, OrganisationProfile, MemberProfile, SignUp, SignIn, VerifyOTP, WelcomeSignup, ForgotPassword, AdminInbox, AdminSubmissions, AdminPlaces, AdminAreas, AreaDetailPage, AdminOrganisations, AdminActivities, AdminMembers, AdminGroups, AdminAuditLog, AdminReports, AdminSettings, AdminAccount, AdminNotifications, AdminAlerts, GeoTreePage, GeoCountryPage, GeoNodePage, PlanTodayPage, PublishingOverview, PublishingActivities, PublishingJoinRequests, PublishingTeam, PublishingPublicProfileEdit, PublishingPlaces, PublishingHistory, UserRequests, MessagesGate, ShopManageRedirect, AgencyManageRedirect, PublishingManage, ProfileHistoryPage, JourneyMapPage, Profile, ProfileSettings, ProfileSettingsDisplay, ProfileSettingsAccount, ProfileSettingsPrivacy, ProfileSettingsNotifications, ProfileSettingsSafety, ProfileVehiclesPage, ProfileVehicleNewPage, ProfileVehicleEditPage, ProfileEdit, ProfileBadges, Submissions, ProfileReviews, JoinRequestDetail, Groups, CommunityClubDetailPage, MyCrewsPage, SecurityPrivacy, Terms, Privacy, Faq, About, Contact, SiteMap, NotFound, DashboardRedirect } from './appLazyPages';
import { PageLoader, AuthAliasRedirect } from './appRouteChrome';

export const AppRoutes = ({ location }: { location: Location }) => (
  <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Navigate to={EXPLORE_MAP_PATH} replace />} />
          <Route
            path={EXPLORE_SEARCH_RESULTS_PATH}
            element={
              <Suspense fallback={<PageLoader />}>
                <ExploreSearchResultsPage />
              </Suspense>
            }
          />
          <Route path="/explore/hub/map" element={<ExploreInboundHubRedirect />} />
          <Route path="/explore/hub/home" element={<ExploreInboundHubRedirect />} />
          <Route path="/explore/hub/search" element={<ExploreInboundHubRedirect />} />
          <Route path="/explore/hub" element={<ExploreInboundHubRedirect />} />
          <Route
            path="/explore"
            element={<ExploreExperience />}
          />
          <Route path={LIST_DISCOVERY_PATH} element={<BrowseListPage />} />
          <Route path="/discovery" element={<DiscoveryRedirect />} />
          <Route path="/place/:id" element={<CanonicalPlaceDetailPage />} />
          <Route path="/facility/:id" element={<FacilityDetailPage />} />
          <Route path="/trail/:id" element={<InboundCanonicalPlaceRedirect />} />
          <Route path="/camp/:id" element={<InboundCanonicalPlaceRedirect />} />
          <Route path="/venue/:id" element={<VenuePlaceDetailPage />} />
          <Route path="/event/:id" element={<InboundCanonicalPlaceRedirect />} />
          <Route path="/event-spot/:id" element={<InboundCanonicalPlaceRedirect />} />
          <Route path="/community-activity/:id" element={<InboundCanonicalPlaceRedirect />} />
          <Route path="/calendar" element={<CalendarRedirect />} />
          <Route path="/people" element={<PeopleRedirect />} />
          <Route
            path="/area/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <AreaDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/plan/today"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <PlanTodayPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/plan" element={<PlanBrowseRoute />} />
          <Route path={HOSTING_HUB_PATH} element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route
            path="/geo"
            element={
              <Suspense fallback={<PageLoader />}>
                <GeoTreePage />
              </Suspense>
            }
          />
          <Route
            path="/geo/country/:code"
            element={
              <Suspense fallback={<PageLoader />}>
                <GeoCountryPage />
              </Suspense>
            }
          />
          <Route
            path="/geo/n/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <GeoNodePage />
              </Suspense>
            }
          />
          <Route
            path="/profile/history"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <ProfileHistoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/history/map"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <JourneyMapPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path={INBOUND_PROFILE_HISTORY_ALIAS_PATH} element={<InboundProfileHistoryAliasRedirect />} />
          <Route path={INBOUND_JOURNEY_MAP_ALIAS_PATH} element={<InboundJourneyMapAliasRedirect />} />
          <Route
            path="/profile/reviews"
            element={
              <ProtectedRoute>
                <ProfileReviews />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/plans" element={<Navigate to={PLAN_PATH} replace />} />
          <Route
            path="/profile/wishlist"
            element={
              <ProtectedRoute>
                <InboundProfileWishlistRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_DISPLAY_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsDisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_ACCOUNT_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_PRIVACY_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_NOTIFICATIONS_SAVED_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_NOTIFICATIONS_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_SETTINGS_SAFETY_PATH}
            element={
              <ProtectedRoute>
                <ProfileSettingsSafety />
              </ProtectedRoute>
            }
          />
          <Route path={APP_SETTINGS_PATH} element={<ProfileSettings />} />
          <Route path={INBOUND_PROFILE_SETTINGS_ACCOUNT_PATH} element={<InboundLegacyProfileSettingsRedirect />} />
          <Route path={INBOUND_PROFILE_SETTINGS_PRIVACY_PATH} element={<InboundLegacyProfileSettingsRedirect />} />
          <Route path={INBOUND_PROFILE_SETTINGS_NOTIFICATIONS_PATH} element={<InboundLegacyProfileSettingsRedirect />} />
          <Route path={INBOUND_PROFILE_SETTINGS_SAFETY_PATH} element={<InboundLegacyProfileSettingsRedirect />} />
          <Route path={INBOUND_PROFILE_SETTINGS_PATH} element={<InboundLegacyProfileSettingsRedirect />} />
          <Route
            path="/profile/vehicles/new"
            element={
              <ProtectedRoute>
                <ProfileVehicleNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/vehicles/:id/edit"
            element={
              <ProtectedRoute>
                <ProfileVehicleEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/vehicles"
            element={
              <ProtectedRoute>
                <ProfileVehiclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/pro-membership"
            element={
              <ProtectedRoute>
                <ProfileProMembership />
              </ProtectedRoute>
            }
          />
          <Route
            path={PROFILE_BADGES_PATH}
            element={
              <ProtectedRoute>
                <ProfileBadges />
              </ProtectedRoute>
            }
          />
          <Route
            path={PROFILE_SUBMISSIONS_PATH}
            element={
              <ProtectedRoute>
                <Submissions />
              </ProtectedRoute>
            }
          />
          <Route
            path={INBOUND_CONTRIBUTIONS_PATH}
            element={<Navigate to={PROFILE_SUBMISSIONS_PATH} replace />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path={INBOUND_TRAIL_POINTS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
          <Route path={INBOUND_MY_REWARDS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
          <Route path={INBOUND_REWARDS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <UserRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests/:requestId"
            element={
              <ProtectedRoute>
                <JoinRequestDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/messages" element={<InboundMessagesRedirect />} />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<PageLoader />}>
                <MessagesGate />
              </Suspense>
            }
          />
          <Route path={NOTIFICATIONS_SETTINGS_PATH} element={<InboundLegacyNotificationsRedirect />} />
          <Route path={NOTIFICATIONS_SAVED_PATH} element={<InboundLegacyNotificationsRedirect />} />
          <Route path={NOTIFICATIONS_PATH} element={<InboundLegacyNotificationsRedirect />} />
          <Route
            path={`${COMMUNITY_CLUB_PATH_PREFIX}/:slug`}
            element={
              <Suspense fallback={<PageLoader />}>
                <CommunityClubDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path={INBOUND_LEGACY_BUDDIES_PATH}
            element={<InboundLegacyBuddiesRedirect />}
          />
          <Route
            path={BUDDIES_PATH}
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <MyCrewsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/activity/:id/crew" element={<ActivityCrewPage />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route
            path="/agency/:id"
            element={
              <ProtectedRoute>
                <OrganisationProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/:id"
            element={
              <ProtectedRoute>
                <OrganisationProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/:userId"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />
          <Route path={INBOUND_BECOME_ORGANIZER_PATH} element={<InboundProMembershipRedirect />} />
          <Route path={INBOUND_BECOME_HOST_PATH} element={<InboundProMembershipRedirect />} />
          <Route path={MEMBERSHIP_MARKETING_PATH} element={<Navigate to={EXPLORE_MAP_PATH} replace />} />
          <Route path="/shop" element={<ShopBrowseRoute />} />
          <Route
            path="/shop/:id"
            element={
              <ProtectedRoute>
                <ShopPublic />
              </ProtectedRoute>
            }
          />
          <Route path="/product/:id" element={<InboundProductPathRedirect />} />
          <Route path="/merchant/:id" element={<InboundMerchantPublicRedirect />} />
          <Route path={SIGNUP_PATH} element={<SignUp />} />
          <Route path={SIGNIN_PATH} element={<SignIn />} />
          <Route path="/signed-out" element={<Navigate to="/" replace />} />
          <Route path="/sign-up" element={<AuthAliasRedirect to={SIGNUP_PATH} />} />
          <Route path="/sign-in" element={<AuthAliasRedirect to={SIGNIN_PATH} />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/security-privacy"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin']}>
                <SecurityPrivacy />
              </ProtectedRoute>
            }
          />
          <Route path="/faq" element={<Faq />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sitemap" element={<SiteMap />} />
          <Route path="/verify" element={<VerifyOTP />} />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin']}>
                <WelcomeSignup />
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<SignIn />} />
          <Route path="/admin" element={<Navigate to="/admin/inbox" replace />} />
          <Route path="/admin/overview" element={<Navigate to="/admin/inbox" replace />} />
          <Route
            path="/admin/inbox"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inbox/submissions"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/places"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminPlaces />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/locations" element={<Navigate to="/admin/places" replace />} />
          <Route
            path="/admin/facilities"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminPlaces catalogSegment="facility" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/areas"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <Suspense fallback={<PageLoader />}>
                  <AdminAreas />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizers"
            element={<Navigate to="/admin/hosts" replace />}
          />
          <Route
            path="/admin/hosts"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminOrganisations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminAuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/account"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shop"
            element={<Navigate to="/admin/hosts" replace />}
          />
          <Route path="/host/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route path="/organizer/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route path="/operator" element={<Navigate to={OPERATOR_OVERVIEW_PATH} replace />} />
          <Route path="/operator/messages" element={<InboundMessagesRedirect />} />
          <Route path="/publishing/messages" element={<InboundMessagesRedirect />} />
          <Route path="/publishing/locations" element={<Navigate to={OPERATOR_PLACES_PATH} replace />} />
          <Route path="/publishing" element={<Navigate to={OPERATOR_OVERVIEW_PATH} replace />} />
          <Route path="/publishing/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route
            path={OPERATOR_OVERVIEW_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_ACTIVITIES_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_ACTIVITIES_NEW_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_REQUESTS_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingJoinRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_TEAM_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_PROFILE_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingPublicProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_SECURITY_PRIVACY_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <SecurityPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_PLACES_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingPlaces />
              </ProtectedRoute>
            }
          />
          <Route
            path={OPERATOR_HISTORY_PATH}
            element={
              <ProtectedRoute publishingWorkspace>
                <PublishingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/overview"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/requests"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={<Navigate to="/profile" replace />}
          />
          <Route
            path="/organisation/manage"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'merchant_admin']}>
                <PublishingManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/manage"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'merchant_admin']}>
                <ShopManageRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/manage"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin']}>
                <AgencyManageRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute roles={['merchant_admin', 'tenant_owner', 'tenant_admin']}>
                <ShopManageRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
);
