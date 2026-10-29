import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from './config/routingCatalogLite';
import {
  INBOUND_CONTRIBUTIONS_PATH,
  INBOUND_MY_REWARDS_PATH,
  INBOUND_REWARDS_PATH,
  INBOUND_TRAIL_POINTS_PATH,
  MEMBERSHIP_MARKETING_PATH,
  PLAN_PATH,
  PROFILE_BADGES_PATH,
  PROFILE_SUBMISSIONS_PATH,
  PUBLISHING_ACTIVITIES_NEW_PATH,
  PUBLISHING_ACTIVITIES_PATH,
  PUBLISHING_HISTORY_PATH,
  PUBLISHING_OVERVIEW_PATH,
  PUBLISHING_PLACES_PATH,
  PUBLISHING_PROFILE_PATH,
  PUBLISHING_REQUESTS_PATH,
  PUBLISHING_SECURITY_PRIVACY_PATH,
  PUBLISHING_TEAM_PATH,
  SIGNIN_PATH,
  SIGNUP_PATH,
} from './config/surfacePaths';
import { INBOUND_BECOME_HOST_PATH, INBOUND_BECOME_ORGANIZER_PATH } from './config/inboundRoutePaths';
import {
  INBOUND_JOURNEY_MAP_ALIAS_PATH,
  INBOUND_PROFILE_HISTORY_ALIAS_PATH,
} from './config/inboundBookmarkPaths';
import { organisationManagePath } from './member/organisationPaths';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { scrollAppScrollRootTo } from './config/layoutScroll';
import { clearAuthReturnContext, loadAuthReturnContext } from './utils/authReturnContext';

const ProtectedRoute = lazy(() =>
  import('./components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute }))
);
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const ExploreExperience = lazy(() => {
  // Start the map library with the explore route. Home never calls this.
  void import('./components/ui/PlacesMap');
  return import('./explore/ui/ExploreExperience').then((m) => ({ default: m.ExploreExperience }));
});
const BrowseListPage = lazy(() =>
  import('./list/BrowseListPage').then((m) => ({ default: m.BrowseListPage }))
);
const NativeDeepLinkHandler = lazy(() =>
  import('./components/NativeDeepLinkHandler').then((m) => ({ default: m.NativeDeepLinkHandler }))
);
const DashboardRedirect = lazy(() =>
  import('./components/auth/DashboardRedirect').then((m) => ({ default: m.DashboardRedirect }))
);
const loadInboundRedirects = () => import('./routing/inboundBookmarkRedirects');
const DiscoveryRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.DiscoveryRedirect }))
);
const InboundCanonicalPlaceRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundCanonicalPlaceRedirect }))
);
const InboundMerchantPublicRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundMerchantPublicRedirect }))
);
const InboundProductPathRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundProductPathRedirect }))
);
const InboundMessagesRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundMessagesRedirect }))
);
const InboundProMembershipRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundProMembershipRedirect }))
);
const InboundProfileWishlistRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundProfileWishlistRedirect }))
);
const InboundRetiredPublishingConsoleRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundRetiredPublishingConsoleRedirect }))
);
const InboundProfileHistoryAliasRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundProfileHistoryAliasRedirect }))
);
const InboundJourneyMapAliasRedirect = lazy(() =>
  loadInboundRedirects().then((m) => ({ default: m.InboundJourneyMapAliasRedirect }))
);

const loadExploreEntryRedirects = () => import('./routing/exploreEntryRedirects');
const ShopBrowseRoute = lazy(() =>
  loadExploreEntryRedirects().then((m) => ({ default: m.ShopBrowseRoute }))
);
const CalendarRedirect = lazy(() =>
  loadExploreEntryRedirects().then((m) => ({ default: m.CalendarRedirect }))
);
const PeopleRedirect = lazy(() =>
  loadExploreEntryRedirects().then((m) => ({ default: m.PeopleRedirect }))
);
const PlanBrowseRoute = lazy(() =>
  import('./routing/planBrowseRoute').then((m) => ({ default: m.PlanBrowseRoute }))
);

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const CanonicalPlaceDetailPage = lazy(() =>
  import('./pages/PlaceDetailPage').then((m) => ({ default: m.CanonicalPlaceDetailPage }))
);
const FacilityDetailPage = lazy(() =>
  import('./pages/FacilityDetailPage').then((m) => ({ default: m.FacilityDetailPage }))
);

const ProfileProMembership = lazy(() =>
  import('./pages/ProfileProMembership').then((m) => ({ default: m.ProfileProMembership }))
);
const ShopPublic = lazy(() => import('./pages/ShopPublic').then((m) => ({ default: m.ShopPublic })));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail').then((m) => ({ default: m.ActivityDetail })));
const OrganisationProfile = lazy(() => import('./pages/OrganisationProfile').then((m) => ({ default: m.OrganisationProfile })));
const MemberProfile = lazy(() => import('./pages/MemberProfile').then((m) => ({ default: m.MemberProfile })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const WelcomeSignup = lazy(() => import('./pages/WelcomeSignup').then((m) => ({ default: m.WelcomeSignup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const AdminOverview = lazy(() => import('./pages/admin/Overview').then((m) => ({ default: m.Overview })));
const AdminPlaces = lazy(() => import('./pages/admin/Places').then((m) => ({ default: m.Places })));
const AdminAreas = lazy(() => import('./pages/admin/Areas').then((m) => ({ default: m.Areas })));
const AreaDetailPage = lazy(() => import('./pages/AreaDetailPage').then((m) => ({ default: m.AreaDetailPage })));
const AdminOrganisations = lazy(() =>
  import('./pages/admin/Organisations').then((m) => ({ default: m.Organisations }))
);
const AdminActivities = lazy(() => import('./pages/admin/Activities').then((m) => ({ default: m.Activities })));
const AdminMembers = lazy(() => import('./pages/admin/Members').then((m) => ({ default: m.Members })));
const AdminGroups = lazy(() => import('./pages/admin/Groups').then((m) => ({ default: m.Groups })));
const AdminAuditLog = lazy(() => import('./pages/admin/AuditLog').then((m) => ({ default: m.AuditLog })));
const AdminReports = lazy(() => import('./pages/admin/Reports').then((m) => ({ default: m.Reports })));
const AdminSettings = lazy(() => import('./pages/admin/Settings').then((m) => ({ default: m.Settings })));
const AdminNotifications = lazy(() =>
  import('./pages/admin/Notifications').then((m) => ({ default: m.Notifications }))
);
const PublishingOverview = lazy(() =>
  import('./pages/publishing/Overview').then((m) => ({ default: m.Overview }))
);
const PublishingActivities = lazy(() =>
  import('./pages/publishing/Activities').then((m) => ({ default: m.Activities }))
);
const PublishingJoinRequests = lazy(() =>
  import('./pages/publishing/JoinRequests').then((m) => ({ default: m.JoinRequests }))
);
const PublishingTeam = lazy(() => import('./pages/publishing/Team').then((m) => ({ default: m.Team })));
const PublishingPublicProfileEdit = lazy(() =>
  import('./pages/publishing/PublicProfileEdit').then((m) => ({ default: m.PublicProfileEdit }))
);
const PublishingPlaces = lazy(() => import('./pages/publishing/Places').then((m) => ({ default: m.Places })));
const PublishingHistory = lazy(() => import('./pages/publishing/History').then((m) => ({ default: m.History })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const MessagesGate = lazy(() => import('./pages/Messages').then((m) => ({ default: m.MessagesGate })));
const ShopManageRedirect = () => <Navigate to={organisationManagePath('shop')} replace />;
const AgencyManageRedirect = () => <Navigate to={organisationManagePath('agency')} replace />;
const PublishingManage = lazy(() => import('./pages/publishing/Manage').then((m) => ({ default: m.Manage })));
const ProfileHistoryPage = lazy(() =>
  import('./pages/ProfileHistory').then((m) => ({ default: m.ProfileHistoryPage }))
);
const JourneyMapPage = lazy(() =>
  import('./pages/JourneyMapPage').then((m) => ({ default: m.JourneyMapPage }))
);
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
const ProfileSettingsAccount = lazy(() =>
  import('./pages/ProfileSettingsAccount').then((m) => ({ default: m.ProfileSettingsAccount }))
);
const ProfileSettingsPrivacy = lazy(() =>
  import('./pages/ProfileSettingsPrivacy').then((m) => ({ default: m.ProfileSettingsPrivacy }))
);
const ProfileSettingsNotifications = lazy(() =>
  import('./pages/ProfileSettingsNotifications').then((m) => ({ default: m.ProfileSettingsNotifications }))
);
const ProfileSettingsSafety = lazy(() =>
  import('./pages/ProfileSettingsSafety').then((m) => ({ default: m.ProfileSettingsSafety }))
);
const ProfileVehiclesPage = lazy(() =>
  import('./pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehiclesPage }))
);
const ProfileVehicleNewPage = lazy(() =>
  import('./pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehicleNewPage }))
);
const ProfileVehicleEditPage = lazy(() =>
  import('./pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehicleEditPage }))
);
const ProfileEdit = lazy(() => import('./pages/ProfileEdit').then((m) => ({ default: m.ProfileEdit })));
const ProfileBadges = lazy(() => import('./pages/ProfileBadges').then((m) => ({ default: m.ProfileBadges })));
const Submissions = lazy(() => import('./pages/Submissions').then((m) => ({ default: m.Submissions })));
const ProfileReviews = lazy(() => import('./pages/ProfileReviews').then((m) => ({ default: m.ProfileReviews })));
const JoinRequestDetail = lazy(() =>
  import('./pages/JoinRequestDetail').then((m) => ({ default: m.JoinRequestDetail }))
);
const Notifications = lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications }))
);
const Groups = lazy(() => import('./pages/Groups').then((m) => ({ default: m.Groups })));
const Buddies = lazy(() => import('./pages/Buddies').then((m) => ({ default: m.Buddies })));
const SecurityPrivacy = lazy(() =>
  import('./pages/SecurityPrivacy').then((m) => ({ default: m.SecurityPrivacy }))
);
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Faq = lazy(() => import('./pages/Faq').then((m) => ({ default: m.Faq })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const SiteMap = lazy(() => import('./pages/SiteMap').then((m) => ({ default: m.SiteMap })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

const PageLoader = () => (
  <div className="app-page-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
  </div>
);

const AuthAliasRedirect = ({ to }: { to: string }) => {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
};

const AuthReturnContextRestorer = () => {
  const location = useLocation();

  useEffect(() => {
    const context = loadAuthReturnContext();
    if (!context) return;

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    if (currentPath !== context.from) {
      return;
    }

    let rafId = 0;
    let timeoutId = 0;
    let cancelled = false;

    const tryRestore = (attempt: number) => {
      if (cancelled) return;

      let targetElement: HTMLElement | null = null;
      if (context.focusSelector) {
        targetElement = document.querySelector<HTMLElement>(context.focusSelector);
      }

      if (!targetElement && location.hash.startsWith('#')) {
        const hashTargetId = decodeURIComponent(location.hash.slice(1));
        if (hashTargetId) {
          targetElement = document.getElementById(hashTargetId);
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        if (typeof targetElement.focus === 'function') {
          targetElement.focus({ preventScroll: true });
        }
        clearAuthReturnContext();
        return;
      }

      if (attempt >= 12) {
        scrollAppScrollRootTo(context.scrollY);
        clearAuthReturnContext();
        return;
      }

      timeoutId = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(() => tryRestore(attempt + 1));
      }, 120);
    };

    rafId = window.requestAnimationFrame(() => tryRestore(0));

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [location.hash, location.pathname, location.search]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={null}>
          <NativeDeepLinkHandler />
        </Suspense>
        <AuthReturnContextRestorer />
        <Layout>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Navigate to={EXPLORE_MAP_PATH} replace />} />
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
          <Route path="/venue/:id" element={<InboundCanonicalPlaceRedirect />} />
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
          <Route path="/plan" element={<PlanBrowseRoute />} />
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
            path="/profile/settings/account"
            element={
              <ProtectedRoute>
                <ProfileSettingsAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/settings/privacy"
            element={
              <ProtectedRoute>
                <ProfileSettingsPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/settings/notifications"
            element={
              <ProtectedRoute>
                <ProfileSettingsNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/settings/safety"
            element={
              <ProtectedRoute>
                <ProfileSettingsSafety />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/notifications"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Notifications />
              </ProtectedRoute>
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
            path="/buddies"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Buddies />
              </ProtectedRoute>
            }
          />
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
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminOverview />
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
            path="/admin/shop"
            element={<Navigate to="/admin/hosts" replace />}
          />
          <Route path="/host/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route path="/operator/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route path="/organizer/*" element={<InboundRetiredPublishingConsoleRedirect />} />
          <Route path="/publishing" element={<Navigate to={PUBLISHING_OVERVIEW_PATH} replace />} />
          <Route path="/publishing/messages" element={<InboundMessagesRedirect />} />
          <Route
            path={PUBLISHING_OVERVIEW_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_ACTIVITIES_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_ACTIVITIES_NEW_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_REQUESTS_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingJoinRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_TEAM_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_PROFILE_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingPublicProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_SECURITY_PRIVACY_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <SecurityPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path={PUBLISHING_PLACES_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <PublishingPlaces />
              </ProtectedRoute>
            }
          />
          <Route path="/publishing/locations" element={<Navigate to={PUBLISHING_PLACES_PATH} replace />} />
          <Route
            path={PUBLISHING_HISTORY_PATH}
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
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
        </Suspense>
      </Layout>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
