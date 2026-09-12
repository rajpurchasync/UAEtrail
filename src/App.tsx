import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardRedirect } from './components/auth/DashboardRedirect';
import { NativeDeepLinkHandler } from './components/NativeDeepLinkHandler';
import { clearAuthReturnContext, loadAuthReturnContext } from './utils/authReturnContext';
import { ActivityFormSessionProvider } from './context/ActivityFormSessionContext';
import { Home } from './pages/Home';
import { Membership } from './pages/Membership';
import { MobileExploreExperience } from './components/explore/MobileExploreExperience';
import { discoveryToExploreSearch, explorePath, parseActivityListFilter } from './utils/exploreRouting';

const LegacyHostPathRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(/^\/organizer/, '/host');
  return <Navigate to={`${next}${search}${hash}`} replace />;
};

const EventSpotRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/event/${id ?? ''}`} replace />;
};

const CommunityActivityRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/event/${id ?? ''}`} replace />;
};

const DiscoveryRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`${explorePath()}?${discoveryToExploreSearch(search)}`} replace />;
};

const ActivitiesBrowseRoute = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab === 'joined' || tab === 'hosted' || searchParams.get('create') || searchParams.get('checkin')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Activities />
      </Suspense>
    );
  }
  const activity = parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter'));
  return (
    <Navigate
      to={explorePath({
        list: true,
        panel: 'activities',
        activity: activity !== 'all' ? activity : undefined,
      })}
      replace
    />
  );
};

const ShopBrowseRoute = () => {
  const [searchParams] = useSearchParams();
  if (searchParams.get('checkout')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Shop />
      </Suspense>
    );
  }
  return <Navigate to={explorePath({ list: true, panel: 'shops', filter: 'shops' })} replace />;
};

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const TrailDetail = lazy(() => import('./pages/TrailDetail').then((m) => ({ default: m.TrailDetail })));
const CampDetail = lazy(() => import('./pages/CampDetail').then((m) => ({ default: m.CampDetail })));
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })));

const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const MerchantPublic = lazy(() => import('./pages/MerchantPublic').then((m) => ({ default: m.MerchantPublic })));
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail').then((m) => ({ default: m.ActivityDetail })));
const OperatorProfile = lazy(() => import('./pages/OperatorProfile').then((m) => ({ default: m.OperatorProfile })));
const MemberProfile = lazy(() => import('./pages/MemberProfile').then((m) => ({ default: m.MemberProfile })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const WelcomeSignup = lazy(() => import('./pages/WelcomeSignup').then((m) => ({ default: m.WelcomeSignup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const AdminOverview = lazy(() => import('./pages/AdminOverview').then((m) => ({ default: m.AdminOverview })));
const AdminLocations = lazy(() => import('./pages/AdminLocations').then((m) => ({ default: m.AdminLocations })));
const AdminHosts = lazy(() => import('./pages/AdminHosts').then((m) => ({ default: m.AdminHosts })));
const AdminActivities = lazy(() => import('./pages/AdminActivities').then((m) => ({ default: m.AdminActivities })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminGroups = lazy(() => import('./pages/AdminGroups').then((m) => ({ default: m.AdminGroups })));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog').then((m) => ({ default: m.AdminAuditLog })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminShop = lazy(() => import('./pages/AdminShop').then((m) => ({ default: m.AdminShop })));
const AdminNotifications = lazy(() =>
  import('./pages/AdminNotifications').then((m) => ({ default: m.AdminNotifications }))
);
const HostOverview = lazy(() => import('./pages/HostOverview').then((m) => ({ default: m.HostOverview })));
const HostActivities = lazy(() => import('./pages/HostActivities').then((m) => ({ default: m.HostActivities })));
const HostRequests = lazy(() => import('./pages/HostRequests').then((m) => ({ default: m.HostRequests })));
const HostTeam = lazy(() => import('./pages/HostTeam').then((m) => ({ default: m.HostTeam })));
const HostProfile = lazy(() => import('./pages/HostProfile').then((m) => ({ default: m.HostProfile })));
const HostLocations = lazy(() => import('./pages/HostLocations').then((m) => ({ default: m.HostLocations })));
const HostHistory = lazy(() => import('./pages/HostHistory').then((m) => ({ default: m.HostHistory })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })));
const MerchantDashboardRedirect = () => <Navigate to="/shop/manage" replace />;
const ShopManage = lazy(() => import('./pages/ShopManage').then((m) => ({ default: m.ShopManage })));
const AgencyManage = lazy(() => import('./pages/AgencyManage').then((m) => ({ default: m.AgencyManage })));
const Activities = lazy(() => import('./pages/Activities').then((m) => ({ default: m.Activities })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
const JoinRequestDetail = lazy(() =>
  import('./pages/JoinRequestDetail').then((m) => ({ default: m.JoinRequestDetail }))
);
const Notifications = lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications }))
);
const Groups = lazy(() => import('./pages/Groups').then((m) => ({ default: m.Groups })));
const Buddies = lazy(() => import('./pages/Buddies').then((m) => ({ default: m.Buddies })));
const BecomeHost = lazy(() => import('./pages/BecomeHost').then((m) => ({ default: m.BecomeHost })));
const MyRewards = lazy(() => import('./pages/MyRewards').then((m) => ({ default: m.MyRewards })));
const TrailPointsAbout = lazy(() =>
  import('./pages/TrailPointsAbout').then((m) => ({ default: m.TrailPointsAbout }))
);
const SecurityPrivacy = lazy(() =>
  import('./pages/SecurityPrivacy').then((m) => ({ default: m.SecurityPrivacy }))
);
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Faq = lazy(() => import('./pages/Faq').then((m) => ({ default: m.Faq })));
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

const LegacyTripsRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/activities${search}`} replace />;
};

const LegacyTripDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/activity/${id}`} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ActivityFormSessionProvider>
        <NativeDeepLinkHandler />
        <AuthReturnContextRestorer />
        <Layout>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Navigate to="/explore" replace />} />
          <Route
            path="/explore"
            element={<MobileExploreExperience />}
          />
          <Route path="/discovery" element={<DiscoveryRedirect />} />
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/event-spot/:id" element={<EventSpotRedirect />} />
          <Route path="/community-activity/:id" element={<CommunityActivityRedirect />} />
          <Route path="/calendar" element={<Navigate to={explorePath({ list: true, panel: 'activities' })} replace />} />
          <Route path="/activities" element={<ActivitiesBrowseRoute />} />
          <Route path="/trips" element={<LegacyTripsRedirect />} />
          <Route
            path="/profile/settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
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
          <Route path="/trail-points" element={<TrailPointsAbout />} />
          <Route
            path="/my-rewards"
            element={
              <ProtectedRoute>
                <MyRewards />
              </ProtectedRoute>
            }
          />
          <Route path="/rewards" element={<Navigate to="/trail-points" replace />} />
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
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
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
          <Route
            path="/activity/:id"
            element={<ActivityDetail />}
          />
          <Route path="/trip/:id" element={<LegacyTripDetailRedirect />} />
          <Route path="/operator/:id" element={<OperatorProfile />} />
          <Route path="/member/:userId" element={<MemberProfile />} />
          <Route path="/become-organizer" element={<BecomeHost />} />
          <Route path="/become-host" element={<BecomeHost />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/shop" element={<ShopBrowseRoute />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/merchant/:id" element={<MerchantPublic />} />
          <Route path="/community" element={<Community />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signed-out" element={<Navigate to="/" replace />} />
          <Route path="/sign-up" element={<AuthAliasRedirect to="/signup" />} />
          <Route path="/sign-in" element={<AuthAliasRedirect to="/signin" />} />
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
            path="/admin/locations"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminLocations />
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
                <AdminHosts />
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
                <AdminUsers />
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
            path="/host/overview"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/activities"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/activities/new"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/requests"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/team"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/profile"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/security-privacy"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <SecurityPrivacy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/locations"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostLocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/history"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <HostHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/messages"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="/organizer/*" element={<LegacyHostPathRedirect />} />
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
            path="/dashboard/trips"
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
                <MerchantDashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
        </ActivityFormSessionProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
