import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardRedirect } from './components/auth/DashboardRedirect';
import { FEATURE_FLAGS } from './config/platform';
import { NativeDeepLinkHandler } from './components/NativeDeepLinkHandler';
import { clearAuthReturnContext, loadAuthReturnContext } from './utils/authReturnContext';
import { ActivityFormSessionProvider } from './context/ActivityFormSessionContext';
import { Home } from './pages/Home';

const LegacyHostPathRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(/^\/organizer/, '/host');
  return <Navigate to={`${next}${search}${hash}`} replace />;
};

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const Discovery = lazy(() => import('./pages/Discovery').then((m) => ({ default: m.Discovery })));
const TrailDetail = lazy(() => import('./pages/TrailDetail').then((m) => ({ default: m.TrailDetail })));
const CampDetail = lazy(() => import('./pages/CampDetail').then((m) => ({ default: m.CampDetail })));
const CommunityActivityDetail = lazy(() =>
  import('./pages/CommunityActivityDetail').then((m) => ({ default: m.CommunityActivityDetail }))
);

const Membership = lazy(() => import('./pages/Membership').then((m) => ({ default: m.Membership })));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const MerchantPublic = lazy(() => import('./pages/MerchantPublic').then((m) => ({ default: m.MerchantPublic })));
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })));
const TripDetail = lazy(() => import('./pages/TripDetail').then((m) => ({ default: m.TripDetail })));
const OperatorProfile = lazy(() => import('./pages/OperatorProfile').then((m) => ({ default: m.OperatorProfile })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const WelcomeSignup = lazy(() => import('./pages/WelcomeSignup').then((m) => ({ default: m.WelcomeSignup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const AdminOverview = lazy(() => import('./pages/AdminOverview').then((m) => ({ default: m.AdminOverview })));
const AdminLocations = lazy(() => import('./pages/AdminLocations').then((m) => ({ default: m.AdminLocations })));
const AdminOrganizers = lazy(() => import('./pages/AdminOrganizers').then((m) => ({ default: m.AdminOrganizers })));
const AdminActivities = lazy(() => import('./pages/AdminActivities').then((m) => ({ default: m.AdminActivities })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminGroups = lazy(() => import('./pages/AdminGroups').then((m) => ({ default: m.AdminGroups })));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog').then((m) => ({ default: m.AdminAuditLog })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminShop = lazy(() => import('./pages/AdminShop').then((m) => ({ default: m.AdminShop })));
const AdminNotifications = lazy(() =>
  import('./pages/AdminNotifications').then((m) => ({ default: m.AdminNotifications }))
);
const OrganizerOverview = lazy(() => import('./pages/OrganizerOverview').then((m) => ({ default: m.OrganizerOverview })));
const OrganizerActivities = lazy(() => import('./pages/OrganizerActivities').then((m) => ({ default: m.OrganizerActivities })));
const OrganizerRequests = lazy(() => import('./pages/OrganizerRequests').then((m) => ({ default: m.OrganizerRequests })));
const OrganizerTeam = lazy(() => import('./pages/OrganizerTeam').then((m) => ({ default: m.OrganizerTeam })));
const OrganizerProfile = lazy(() => import('./pages/OrganizerProfile').then((m) => ({ default: m.OrganizerProfile })));
const OrganizerLocations = lazy(() => import('./pages/OrganizerLocations').then((m) => ({ default: m.OrganizerLocations })));
const OrganizerHistory = lazy(() => import('./pages/OrganizerHistory').then((m) => ({ default: m.OrganizerHistory })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard').then((m) => ({ default: m.MerchantDashboard })));
const Trips = lazy(() => import('./pages/Trips').then((m) => ({ default: m.Activities })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const JoinRequestDetail = lazy(() =>
  import('./pages/JoinRequestDetail').then((m) => ({ default: m.JoinRequestDetail }))
);
const Notifications = lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications }))
);
const Groups = lazy(() => import('./pages/Groups').then((m) => ({ default: m.Groups })));
const BecomeOrganizer = lazy(() =>
  import('./pages/BecomeOrganizer').then((m) => ({ default: m.BecomeOrganizer }))
);
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

/** @deprecated Consumer routes are open to all roles; staff can browse trips and discovery. */
const ConsumerRoute = ({ children }: { children: JSX.Element }) => children;

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
          <Route path="/" element={<ConsumerRoute><Home /></ConsumerRoute>} />
          <Route path="/discovery" element={<ConsumerRoute><Discovery /></ConsumerRoute>} />
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/community-activity/:id" element={<CommunityActivityDetail />} />
          <Route path="/calendar" element={<Navigate to="/activities" replace />} />
          <Route path="/activities" element={<ConsumerRoute><Trips /></ConsumerRoute>} />
          <Route path="/trips" element={<LegacyTripsRedirect />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['participant']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/trail-points" element={<ConsumerRoute><TrailPointsAbout /></ConsumerRoute>} />
          <Route
            path="/my-rewards"
            element={
              <ProtectedRoute roles={['participant']}>
                <MyRewards />
              </ProtectedRoute>
            }
          />
          <Route path="/rewards" element={<Navigate to="/trail-points" replace />} />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute roles={['participant']}>
                <UserRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests/:requestId"
            element={
              <ProtectedRoute roles={['participant']}>
                <JoinRequestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute roles={['participant', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Favorites />
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
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/operator/:id" element={<OperatorProfile />} />
          <Route path="/become-organizer" element={<BecomeOrganizer />} />
          <Route path="/become-host" element={<BecomeOrganizer />} />
          <Route
            path="/membership"
            element={FEATURE_FLAGS.membershipEnabled ? <Membership /> : <Navigate to="/trail-points" replace />}
          />
          <Route path="/shop" element={<ConsumerRoute><Shop /></ConsumerRoute>} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/merchant/:id" element={<MerchantPublic />} />
          <Route path="/community" element={<ConsumerRoute><Community /></ConsumerRoute>} />
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
                <AdminOrganizers />
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
                <OrganizerOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/activities"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/activities/new"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/requests"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/team"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/profile"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerProfile />
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
                <OrganizerLocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/history"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerHistory />
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
            path="/merchant/dashboard"
            element={
              <ProtectedRoute roles={['merchant_admin']}>
                <MerchantDashboard />
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
