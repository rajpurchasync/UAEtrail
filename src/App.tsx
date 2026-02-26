import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import {
  Home,
  Discovery,
  TrailDetail,
  CampDetail,
  Calendar,
  Membership,
  Shop,
  Community,
  TripDetail,
  OperatorProfile,
  SignUp,
  SignIn,
  AdminOverview,
  AdminLocations,
  AdminOrganizers,
  AdminEvents,
  OrganizerOverview,
  OrganizerEvents,
  OrganizerRequests,
  OrganizerTeam,
  OrganizerProfile,
  UserOverview,
  UserRequests,
  UserTrips,
  UserProfile
} from './pages';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/camp/:id" element={<CampDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/operator/:id" element={<OperatorProfile />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/community" element={<Community />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
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
            element={
              <ProtectedRoute roles={['visitor', 'tenant_owner', 'tenant_admin', 'tenant_guide', 'platform_admin']}>
                <UserProfile />
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
      </Layout>
    </Router>
  );
}

export default App;
