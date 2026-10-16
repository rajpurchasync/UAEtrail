import {
  COMMUNITY_PATH,
  EXPLORE_MAP_PATH,
  LEGACY_MY_REWARDS_PATH,
  LEGACY_REWARDS_PATH,
  LEGACY_TRAIL_POINTS_PATH,
  MEMBERSHIP_MARKETING_PATH,
  PROFILE_BADGES_PATH,
} from './config/routingCatalog';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { clearAuthReturnContext, loadAuthReturnContext } from './utils/authReturnContext';
import { useAuth } from './context/AuthContext';
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Membership = lazy(() => import('./pages/Membership').then((m) => ({ default: m.Membership })));
const ExploreExperience = lazy(() =>
  import('./explore/ui/ExploreExperience').then((m) => ({ default: m.ExploreExperience }))
);
const BrowseListPage = lazy(() =>
  import('./list/BrowseListPage').then((m) => ({ default: m.BrowseListPage }))
);
const NativeDeepLinkHandler = lazy(() =>
  import('./components/NativeDeepLinkHandler').then((m) => ({ default: m.NativeDeepLinkHandler }))
);
const DashboardRedirect = lazy(() =>
  import('./components/auth/DashboardRedirect').then((m) => ({ default: m.DashboardRedirect }))
);
const GuestTabPlaceholder = lazy(() =>
  import('./components/auth/GuestTabPlaceholder').then((m) => ({ default: m.GuestTabPlaceholder }))
);

import {
  discoveryToExploreSearch,
  explorePath,
  explorePeopleBrowsePath,
  legacyCreateParamToOrganizePath,
  parseActivityListFilter,
  LIST_DISCOVERY_PATH,
} from './config/routingCatalog';
import { organisationManagePath, SIGNIN_PATH, SIGNUP_PATH } from './config/routingCatalog';
import { PRODUCT_PLAN_SURFACE_TITLE } from './content/productNorthStar';
import {
  JOURNEY_MAP_PATH,
  LEGACY_CONTRIBUTIONS_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_SUBMISSIONS_PATH,
} from './config/surfacePaths';
import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';
import { resolveLegacyTripsHubRedirect } from './member-plan/legacyTripsRedirect';
import { useMemberStatus } from './hooks/useMemberStatus';
import { memberCanManageHostedActivities } from './utils/hostedActivitiesGate';

const LegacyPublishingConsoleRedirect = ({ legacyPrefix }: { legacyPrefix: '/host' | '/organizer' }) => {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(new RegExp(`^${legacyPrefix}`), '/operator');
  return <Navigate to={`${next}${search}${hash}`} replace />;
};

/** Chat has one canonical route (`/chat`) — legacy console URLs preserved query only. */
const LegacyConsoleMessagesRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate to={`/chat${search}${hash}`} replace />;
};

const LegacyMessagesRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate to={`/chat${search}${hash}`} replace />;
};

const EventSpotRedirect = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};

const CommunityActivityRedirect = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};

/** Legacy `/event/:id` place URLs → canonical `/place/:id`. */
const LegacyEventPlaceRedirect = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};

const DiscoveryRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`${explorePath()}?${discoveryToExploreSearch(search)}`} replace />;
};

const LegacyTripsHubRedirect = () => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);
  const target = resolveLegacyTripsHubRedirect(pathname, search, { canHost });
  return <Navigate to={target ?? PLAN_PATH} replace />;
};

const PlanBrowseRoute = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const legacyCreatePath = legacyCreateParamToOrganizePath(searchParams.get('create'));
  if (legacyCreatePath) {
    return <Navigate to={legacyCreatePath} replace />;
  }
  if (user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Activities />
      </Suspense>
    );
  }
  if (tab === 'joined' || tab === 'hosted' || searchParams.get('checkin') || !tab) {
    return (
      <GuestTabPlaceholder
        title={PRODUCT_PLAN_SURFACE_TITLE}
        description="Sign in to see what is next on your calendar and track outdoor goals."
        intent="explore-browse"
      />
    );
  }
  const activity = parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter'));
  return (
    <Navigate
      to={explorePath({
        activity: activity !== 'all' ? activity : undefined,
      })}
      replace
    />
  );
};

const ShopBrowseRoute = () => (
  <Navigate to={explorePath({ panel: 'shops', filter: 'shops' })} replace />
);

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const TrailDetail = lazy(() => import('./pages/TrailDetail').then((m) => ({ default: m.TrailDetail })));
const CampDetail = lazy(() => import('./pages/CampDetail').then((m) => ({ default: m.CampDetail })));
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })));
const CanonicalPlaceDetailPage = lazy(() =>
  import('./pages/PlaceDetailPage').then((m) => ({ default: m.CanonicalPlaceDetailPage }))
);
const FacilityDetailPage = lazy(() =>
  import('./pages/FacilityDetailPage').then((m) => ({ default: m.FacilityDetailPage }))
);

const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const BecomeHost = lazy(() =>
  import('./pages/BecomeHost').then((m) => ({ default: m.BecomeHost }))
);
const ProfileProMembership = lazy(() =>
  import('./pages/ProfileProMembership').then((m) => ({ default: m.ProfileProMembership }))
);
/** Legacy redirect — canonical public shop URL is `/shop/:id`. */
const LegacyMerchantPublicRedirect = lazy(() =>
  import('./pages/MerchantPublic').then((m) => ({ default: m.MerchantPublic }))
);
const ShopPublic = lazy(() => import('./pages/ShopPublic').then((m) => ({ default: m.ShopPublic })));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail').then((m) => ({ default: m.ActivityDetail })));
const OrganisationProfile = lazy(() => import('./pages/OrganisationProfile').then((m) => ({ default: m.OrganisationProfile })));
const LegacyOperatorProfileRedirect = lazy(() =>
  import('./pages/LegacyOperatorProfileRedirect').then((m) => ({ default: m.LegacyOperatorProfileRedirect }))
);
const MemberProfile = lazy(() => import('./pages/MemberProfile').then((m) => ({ default: m.MemberProfile })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const WelcomeSignup = lazy(() => import('./pages/WelcomeSignup').then((m) => ({ default: m.WelcomeSignup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const AdminOverview = lazy(() => import('./pages/AdminOverview').then((m) => ({ default: m.AdminOverview })));
const AdminPlaces = lazy(() => import('./pages/AdminPlaces').then((m) => ({ default: m.AdminPlaces })));
const AdminAreas = lazy(() => import('./pages/AdminAreas').then((m) => ({ default: m.AdminAreas })));
const AreaDetailPage = lazy(() => import('./pages/AreaDetailPage').then((m) => ({ default: m.AreaDetailPage })));
const AdminOrganisations = lazy(() =>
  import('./pages/AdminOrganisations').then((m) => ({ default: m.AdminOrganisations }))
);
const AdminActivities = lazy(() => import('./pages/AdminActivities').then((m) => ({ default: m.AdminActivities })));
const AdminMembers = lazy(() => import('./pages/AdminMembers').then((m) => ({ default: m.AdminMembers })));
const AdminGroups = lazy(() => import('./pages/AdminGroups').then((m) => ({ default: m.AdminGroups })));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog').then((m) => ({ default: m.AdminAuditLog })));
const AdminReports = lazy(() => import('./pages/AdminReports').then((m) => ({ default: m.AdminReports })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminShop = lazy(() => import('./pages/AdminShop').then((m) => ({ default: m.AdminShop })));
const AdminNotifications = lazy(() =>
  import('./pages/AdminNotifications').then((m) => ({ default: m.AdminNotifications }))
);
const OperatorOverview = lazy(() =>
  import('./pages/operator/Overview').then((m) => ({ default: m.Overview }))
);
const OperatorActivities = lazy(() =>
  import('./pages/operator/Activities').then((m) => ({ default: m.Activities }))
);
const OperatorJoinRequests = lazy(() =>
  import('./pages/operator/JoinRequests').then((m) => ({ default: m.JoinRequests }))
);
const OperatorTeam = lazy(() => import('./pages/operator/Team').then((m) => ({ default: m.Team })));
const OperatorPublicProfileEdit = lazy(() =>
  import('./pages/operator/PublicProfileEdit').then((m) => ({ default: m.PublicProfileEdit }))
);
const OperatorPlaces = lazy(() => import('./pages/operator/Places').then((m) => ({ default: m.Places })));
const OperatorHistory = lazy(() => import('./pages/operator/History').then((m) => ({ default: m.History })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })));
const MessagesGate = lazy(() => import('./pages/Messages').then((m) => ({ default: m.MessagesGate })));
const ShopManageRedirect = () => <Navigate to={organisationManagePath('shop')} replace />;
const OperatorManage = lazy(() => import('./pages/operator/Manage').then((m) => ({ default: m.Manage })));
const ShopManage = lazy(() => import('./pages/ShopManage').then((m) => ({ default: m.ShopManage })));
const AgencyManage = lazy(() => import('./pages/AgencyManage').then((m) => ({ default: m.AgencyManage })));
const Activities = lazy(() => import('./pages/Activities').then((m) => ({ default: m.Activities })));
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
const ProfileEdit = lazy(() => import('./pages/ProfileEdit').then((m) => ({ default: m.ProfileEdit })));
const ProfileBadges = lazy(() => import('./pages/ProfileBadges').then((m) => ({ default: m.ProfileBadges })));
const Contributions = lazy(() => import('./pages/Contributions').then((m) => ({ default: m.Contributions })));
const ProfileReviews = lazy(() => import('./pages/ProfileReviews').then((m) => ({ default: m.ProfileReviews })));
const ProfileWishlist = lazy(() => import('./pages/ProfileWishlist').then((m) => ({ default: m.ProfileWishlist })));
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
  <div className="min-h-screen flex items-center justify-center">
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
        window.scrollTo({ top: context.scrollY, behavior: 'auto' });
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
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/venue/:id" element={<EventDetail />} />
          <Route path="/event/:id" element={<LegacyEventPlaceRedirect />} />
          <Route path="/event-spot/:id" element={<EventSpotRedirect />} />
          <Route path="/community-activity/:id" element={<CommunityActivityRedirect />} />
          <Route path="/calendar" element={<Navigate to={explorePath({ panel: 'activities' })} replace />} />
          <Route path="/people" element={<Navigate to={explorePeopleBrowsePath()} replace />} />
          <Route
            path="/area/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <AreaDetailPage />
              </Suspense>
            }
          />
          <Route path="/plan" element={<PlanBrowseRoute />} />
          <Route path="/trips" element={<LegacyTripsHubRedirect />} />
          <Route path="/trips/map" element={<LegacyTripsHubRedirect />} />
          <Route path="/activities" element={<LegacyTripsHubRedirect />} />
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
          <Route path="/profile/my-trips" element={<AuthAliasRedirect to={PROFILE_HISTORY_PATH} />} />
          <Route path="/profile/my-trips/map" element={<AuthAliasRedirect to={JOURNEY_MAP_PATH} />} />
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
                <ProfileWishlist />
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
            path="/profile/settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
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
                <Contributions />
              </ProtectedRoute>
            }
          />
          <Route
            path={LEGACY_CONTRIBUTIONS_PATH}
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
          <Route path={LEGACY_TRAIL_POINTS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
          <Route path={LEGACY_MY_REWARDS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
          <Route path={LEGACY_REWARDS_PATH} element={<Navigate to={PROFILE_BADGES_PATH} replace />} />
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
          <Route path="/messages" element={<LegacyMessagesRedirect />} />
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
            path="/guide/:id"
            element={
              <ProtectedRoute>
                <OrganisationProfile />
              </ProtectedRoute>
            }
          />
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
          <Route path="/operator/:id" element={<LegacyOperatorProfileRedirect />} />
          <Route
            path="/member/:userId"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/become-organizer" element={<BecomeHost />} />
          <Route path="/become-host" element={<BecomeHost />} />
          <Route path={MEMBERSHIP_MARKETING_PATH} element={<Membership />} />
          <Route path="/shop" element={<ShopBrowseRoute />} />
          <Route
            path="/shop/:id"
            element={
              <ProtectedRoute>
                <ShopPublic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/merchant/:id" element={<LegacyMerchantPublicRedirect />} />
          <Route path={COMMUNITY_PATH} element={<Navigate to={EXPLORE_MAP_PATH} replace />} />
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
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminShop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/overview"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/activities"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/activities/new"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/requests"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorJoinRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/team"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/profile"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorPublicProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/security-privacy"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <SecurityPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/places"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorPlaces />
              </ProtectedRoute>
            }
          />
          <Route path="/operator/locations" element={<Navigate to="/operator/places" replace />} />
          <Route
            path="/operator/history"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OperatorHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/messages"
            element={<LegacyConsoleMessagesRedirect />}
          />
          <Route
            path="/operator/messages"
            element={<LegacyConsoleMessagesRedirect />}
          />
          <Route path="/host/*" element={<LegacyPublishingConsoleRedirect legacyPrefix="/host" />} />
          <Route path="/organizer/*" element={<LegacyPublishingConsoleRedirect legacyPrefix="/organizer" />} />
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
                <OperatorManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/manage"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'merchant_admin']}>
                <ShopManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/manage"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin']}>
                <AgencyManage />
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
