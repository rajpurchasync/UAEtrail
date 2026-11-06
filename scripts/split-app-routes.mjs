import fs from 'node:fs';

const app = fs.readFileSync('src/App.tsx', 'utf8');
const lazyStart = app.indexOf('const ProtectedRoute');
const lazyEnd = app.indexOf('const PageLoader');
const chromeStart = lazyEnd;
const chromeEnd = app.indexOf('function App()');
const routesStart = app.indexOf('<Routes>');
const routesEnd = app.indexOf('</Routes>') + '</Routes>'.length;

const lazyBlock = app
  .slice(lazyStart, lazyEnd)
  .replace(/^const /gm, 'export const ')
  .replace(/import\('\.\/routing\//g, "import('./")
  .replace(/import\('\.\/(components|pages|explore|list)\//g, "import('../$1/");
fs.writeFileSync(
  'src/routing/appLazyPages.tsx',
  `import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { organisationManagePath } from '../member/organisationPaths';

${lazyBlock}`
);

const chrome = app.slice(chromeStart, chromeEnd);
fs.writeFileSync(
  'src/routing/appRouteChrome.tsx',
  `import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { scrollAppScrollRootTo } from '../config/layoutScroll';
import { clearAuthReturnContext, loadAuthReturnContext } from '../utils/authReturnContext';

${chrome
  .replace('const PageLoader', 'export const PageLoader')
  .replace('const AuthAliasRedirect', 'export const AuthAliasRedirect')
  .replace('const AuthReturnContextRestorer', 'export const AuthReturnContextRestorer')}`
);

const routesBody = app.slice(routesStart, routesEnd);
const routeImports = `import { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/routingCatalogLite';
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
} from '../config/surfacePaths';
import { INBOUND_BECOME_HOST_PATH, INBOUND_BECOME_ORGANIZER_PATH } from '../config/inboundRoutePaths';
import {
  INBOUND_JOURNEY_MAP_ALIAS_PATH,
  INBOUND_PROFILE_HISTORY_ALIAS_PATH,
} from '../config/inboundBookmarkPaths';
import { ProtectedRoute, Home, ExploreExperience, BrowseListPage, DiscoveryRedirect, InboundCanonicalPlaceRedirect, InboundMerchantPublicRedirect, InboundProductPathRedirect, InboundMessagesRedirect, InboundProMembershipRedirect, InboundProfileWishlistRedirect, InboundRetiredPublishingConsoleRedirect, InboundProfileHistoryAliasRedirect, InboundJourneyMapAliasRedirect, ShopBrowseRoute, CalendarRedirect, PeopleRedirect, PlanBrowseRoute, CanonicalPlaceDetailPage, FacilityDetailPage, ProfileProMembership, ShopPublic, ActivityDetail, OrganisationProfile, MemberProfile, SignUp, SignIn, VerifyOTP, WelcomeSignup, ForgotPassword, AdminOverview, AdminPlaces, AdminAreas, AreaDetailPage, AdminOrganisations, AdminActivities, AdminMembers, AdminGroups, AdminAuditLog, AdminReports, AdminSettings, AdminAccount, AdminNotifications, PublishingOverview, PublishingActivities, PublishingJoinRequests, PublishingTeam, PublishingPublicProfileEdit, PublishingPlaces, PublishingHistory, UserRequests, MessagesGate, ShopManageRedirect, AgencyManageRedirect, PublishingManage, ProfileHistoryPage, JourneyMapPage, Profile, ProfileSettings, ProfileSettingsAccount, ProfileSettingsPrivacy, ProfileSettingsNotifications, ProfileSettingsSafety, ProfileVehiclesPage, ProfileVehicleNewPage, ProfileVehicleEditPage, ProfileEdit, ProfileBadges, Submissions, ProfileReviews, JoinRequestDetail, Notifications, Groups, Buddies, SecurityPrivacy, Terms, Privacy, Faq, About, Contact, SiteMap, NotFound, DashboardRedirect } from './appLazyPages';
import { PageLoader, AuthAliasRedirect } from './appRouteChrome';

export const AppRoutes = () => (
  ${routesBody}
);
`;

fs.writeFileSync('src/routing/AppRoutes.tsx', routeImports);

const newApp = `import { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { NativeDeepLinkHandler } from './routing/appLazyPages';
import { AuthReturnContextRestorer, PageLoader } from './routing/appRouteChrome';
import { AppRoutes } from './routing/AppRoutes';

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
            <AppRoutes />
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
`;

fs.writeFileSync('src/App.tsx', newApp);
console.log('split ok');
