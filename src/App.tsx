import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardRedirect } from './components/auth/DashboardRedirect';
import { FEATURE_FLAGS } from './config/platform';
import { NativeDeepLinkHandler } from './components/NativeDeepLinkHandler';

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Discovery = lazy(() => import('./pages/Discovery').then((m) => ({ default: m.Discovery })));
const TrailDetail = lazy(() => import('./pages/TrailDetail').then((m) => ({ default: m.TrailDetail })));
const CampDetail = lazy(() => import('./pages/CampDetail').then((m) => ({ default: m.CampDetail })));

const Membership = lazy(() => import('./pages/Membership').then((m) => ({ default: m.Membership })));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const MerchantPublic = lazy(() => import('./pages/MerchantPublic').then((m) => ({ default: m.MerchantPublic })));
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })));
const TripDetail = lazy(() => import('./pages/TripDetail').then((m) => ({ default: m.TripDetail })));
const OperatorProfile = lazy(() => import('./pages/OperatorProfile').then((m) => ({ default: m.OperatorProfile })));
const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const SignedOut = lazy(() => import('./pages/SignedOut').then((m) => ({ default: m.SignedOut })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const AdminOverview = lazy(() => import('./pages/AdminOverview').then((m) => ({ default: m.AdminOverview })));
const AdminLocations = lazy(() => import('./pages/AdminLocations').then((m) => ({ default: m.AdminLocations })));
const AdminOrganizers = lazy(() => import('./pages/AdminOrganizers').then((m) => ({ default: m.AdminOrganizers })));
const AdminEvents = lazy(() => import('./pages/AdminEvents').then((m) => ({ default: m.AdminEvents })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog').then((m) => ({ default: m.AdminAuditLog })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminShop = lazy(() => import('./pages/AdminShop').then((m) => ({ default: m.AdminShop })));
const OrganizerOverview = lazy(() => import('./pages/OrganizerOverview').then((m) => ({ default: m.OrganizerOverview })));
const OrganizerEvents = lazy(() => import('./pages/OrganizerEvents').then((m) => ({ default: m.OrganizerEvents })));
const OrganizerRequests = lazy(() => import('./pages/OrganizerRequests').then((m) => ({ default: m.OrganizerRequests })));
const OrganizerTeam = lazy(() => import('./pages/OrganizerTeam').then((m) => ({ default: m.OrganizerTeam })));
const OrganizerProfile = lazy(() => import('./pages/OrganizerProfile').then((m) => ({ default: m.OrganizerProfile })));
const OrganizerLocations = lazy(() => import('./pages/OrganizerLocations').then((m) => ({ default: m.OrganizerLocations })));
const OrganizerHistory = lazy(() => import('./pages/OrganizerHistory').then((m) => ({ default: m.OrganizerHistory })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard').then((m) => ({ default: m.MerchantDashboard })));
const Trips = lazy(() => import('./pages/Trips').then((m) => ({ default: m.Trips })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const JoinRequestDetail = lazy(() =>
  import('./pages/JoinRequestDetail').then((m) => ({ default: m.JoinRequestDetail }))
);
const Notifications = lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications }))
);
const BecomeOrganizer = lazy(() =>
  import('./pages/BecomeOrganizer').then((m) => ({ default: m.BecomeOrganizer }))
);
const MyRewards = lazy(() => import('./pages/MyRewards').then((m) => ({ default: m.MyRewards })));
const TrailPointsAbout = lazy(() =>
  import('./pages/TrailPointsAbout').then((m) => ({ default: m.TrailPointsAbout }))
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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NativeDeepLinkHandler />
        <Layout>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/calendar" element={<Navigate to="/trips" replace />} />
          <Route path="/trips" element={<Trips />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['visitor']}>
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
              <ProtectedRoute roles={['visitor']}>
                <UserRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests/:requestId"
            element={
              <ProtectedRoute roles={['visitor']}>
                <JoinRequestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={['visitor']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Notifications />
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
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/merchant/:id" element={<MerchantPublic />} />
          <Route path="/community" element={<Community />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signed-out" element={<SignedOut />} />
          <Route path="/sign-up" element={<AuthAliasRedirect to="/signup" />} />
          <Route path="/sign-in" element={<AuthAliasRedirect to="/signin" />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/verify" element={<VerifyOTP />} />
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
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminOrganizers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminEvents />
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
            path="/admin/audit-log"
            element={
              <ProtectedRoute roles={['platform_admin']}>
                <AdminAuditLog />
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
            path="/organizer/overview"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events/new"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/requests"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/team"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/profile"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/locations"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerLocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/history"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <OrganizerHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/messages"
            element={
              <ProtectedRoute roles={['tenant_owner', 'tenant_admin', 'tenant_guide']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/overview"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/requests"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trips"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
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
              <ProtectedRoute roles={['visitor', 'merchant_admin', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <MerchantDashboard />
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
