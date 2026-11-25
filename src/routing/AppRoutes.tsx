import { Suspense } from 'react';
import { Route, Routes, type Location } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../config/routingCatalogLite';
import { COMMUNITY_CLUB_PATH_PREFIX } from '../config/routingCatalog';
import { EXPLORE_SEARCH_RESULTS_PATH } from '../explore/search/exploreSearchRouting';
import {
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
  OPERATOR_ACTIVITIES_NEW_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_SECURITY_PRIVACY_PATH,
  OPERATOR_TEAM_PATH,
  OPERATOR_CONSOLE_PREFIX,
  SIGNIN_PATH,
  SIGNUP_PATH,
  MY_CREWS_PATH,
} from '../config/surfacePaths';
import { ADMIN_AREAS_PATH, ADMIN_DESTINATIONS_PATH } from '../config/adminSurfacePaths';
import { ORGANISATION_MANAGE_PATH } from '../member/organisationPaths';
import {
  ProtectedRoute,
  Home,
  ExploreExperience,
  ExploreSearchResultsPage,
  BrowseListPage,
  PlanBrowseRoute,
  CanonicalPlaceDetailPage,
  VenuePlaceDetailPage,
  FacilityDetailPage,
  ProfileProMembership,
  ShopPublic,
  ActivityDetail,
  ActivityCrewPage,
  OrganisationProfile,
  MemberProfile,
  SignUp,
  SignIn,
  VerifyOTP,
  WelcomeSignup,
  ForgotPassword,
  AdminInbox,
  AdminSubmissions,
  AdminPlaces,
  AdminAreas,
  AreaDetailPage,
  AdminOrganisations,
  AdminActivities,
  AdminMembers,
  AdminGroups,
  AdminCommunities,
  AdminAuditLog,
  AdminReports,
  AdminSettings,
  AdminAccount,
  AdminNotifications,
  AdminAlerts,
  GeoTreePage,
  GeoCountryPage,
  GeoNodePage,
  PlanTodayPage,
  PublishingOverview,
  PublishingActivities,
  PublishingJoinRequests,
  PublishingTeam,
  PublishingPublicProfileEdit,
  PublishingPlaces,
  PublishingHistory,
  UserRequests,
  MessagesGate,
  PublishingManage,
  ProfileHistoryPage,
  JourneyMapPage,
  Profile,
  ProfileSettings,
  ProfileSettingsDisplay,
  ProfileSettingsAccount,
  ProfileSettingsPrivacy,
  ProfileSettingsNotifications,
  ProfileSettingsSafety,
  ProfileVehiclesPage,
  ProfileVehicleNewPage,
  ProfileVehicleEditPage,
  ProfileEdit,
  ProfileGuide,
  ProfileBadges,
  Submissions,
  ProfileReviews,
  JoinRequestDetail,
  Groups,
  CommunityClubDetailPage,
  MyCrewsPage,
  SecurityPrivacy,
  Terms,
  Privacy,
  Faq,
  About,
  Contact,
  SiteMap,
  NotFound,
} from './appLazyPages';
import { PageLoader } from './appRouteChrome';

const adminInboxRoute = (
  <ProtectedRoute roles={['platform_admin']}>
    <AdminInbox />
  </ProtectedRoute>
);

const adminDestinationsRoute = (
  <ProtectedRoute roles={['platform_admin']}>
    <Suspense fallback={<PageLoader />}>
      <AdminAreas />
    </Suspense>
  </ProtectedRoute>
);

const operatorOverviewRoute = (
  <ProtectedRoute publishingWorkspace>
    <PublishingOverview />
  </ProtectedRoute>
);

export const AppRoutes = ({ location }: { location: Location }) => (
  <Routes location={location}>
    <Route path="/" element={<Home />} />
    <Route
      path={EXPLORE_SEARCH_RESULTS_PATH}
      element={
        <Suspense fallback={<PageLoader />}>
          <ExploreSearchResultsPage />
        </Suspense>
      }
    />
    <Route path="/explore" element={<ExploreExperience />} />
    <Route path={LIST_DISCOVERY_PATH} element={<BrowseListPage />} />
    <Route path="/place/:id" element={<CanonicalPlaceDetailPage />} />
    <Route path="/facility/:id" element={<FacilityDetailPage />} />
    <Route path="/venue/:id" element={<VenuePlaceDetailPage />} />
    <Route
      path="/destination/:slug"
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
    <Route path={PLAN_PATH} element={<PlanBrowseRoute />} />
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
    <Route
      path="/profile/reviews"
      element={
        <ProtectedRoute>
          <ProfileReviews />
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
      path="/profile/guide"
      element={
        <ProtectedRoute>
          <ProfileGuide />
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
      path="/profile"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
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
    <Route
      path="/chat"
      element={
        <Suspense fallback={<PageLoader />}>
          <MessagesGate />
        </Suspense>
      }
    />
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
      path={MY_CREWS_PATH}
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
    <Route
      path="/shop/:id"
      element={
        <ProtectedRoute>
          <ShopPublic />
        </ProtectedRoute>
      }
    />
    <Route path={SIGNUP_PATH} element={<SignUp />} />
    <Route path={SIGNIN_PATH} element={<SignIn />} />
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
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/admin/login" element={<SignIn />} />
    <Route path="/admin" element={adminInboxRoute} />
    <Route path="/admin/inbox" element={adminInboxRoute} />
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
    <Route
      path="/admin/facilities"
      element={
        <ProtectedRoute roles={['platform_admin']}>
          <AdminPlaces catalogSegment="facility" />
        </ProtectedRoute>
      }
    />
    <Route path={ADMIN_DESTINATIONS_PATH} element={adminDestinationsRoute} />
    <Route path={ADMIN_AREAS_PATH} element={adminDestinationsRoute} />
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
      path="/admin/communities"
      element={
        <ProtectedRoute roles={['platform_admin']}>
          <AdminCommunities />
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
    <Route path={OPERATOR_CONSOLE_PREFIX} element={operatorOverviewRoute} />
    <Route path={OPERATOR_OVERVIEW_PATH} element={operatorOverviewRoute} />
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
      path={ORGANISATION_MANAGE_PATH}
      element={
        <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'merchant_admin']}>
          <PublishingManage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);