import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));
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
const UserOverview = lazy(() => import('./pages/UserOverview').then((m) => ({ default: m.UserOverview })));
const UserRequests = lazy(() => import('./pages/UserRequests').then((m) => ({ default: m.UserRequests })));
const UserTrips = lazy(() => import('./pages/UserTrips').then((m) => ({ default: m.UserTrips })));
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })));
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard').then((m) => ({ default: m.MerchantDashboard })));
const Trips = lazy(() => import('./pages/Trips').then((m) => ({ default: m.Trips })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const BecomeOrganizer = lazy(() => import('./pages/BecomeOrganizer').then((m) => ({ default: m.BecomeOrganizer })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/calendar" element={<Navigate to="/trips" replace />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/operator/:id" element={<OperatorProfile />} />
          <Route path="/become-organizer" element={<BecomeOrganizer />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/merchant/:id" element={<MerchantPublic />} />
          <Route path="/community" element={<Community />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify" element={<VerifyOTP />} />
          <Route path="/onboarding" element={<Onboarding />} />
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
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <UserOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/requests"
            element={
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <UserRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trips"
            element={
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <UserTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={<Navigate to="/profile" replace />}
          />
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                <a href="/" className="text-emerald-600 hover:text-emerald-700">Go back home</a>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
      </Layout>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
