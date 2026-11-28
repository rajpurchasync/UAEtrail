import { lazy } from 'react';

export const ProtectedRoute = lazy(() =>
  import('../components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute }))
);
export const Home = lazy(() => import('../pages/Home').then((m) => ({ default: m.Home })));
export const ExploreExperience = lazy(() => {
  // Start the map library with the explore route. Home never calls this.
  return import('../explore/ui/ExploreExperience').then((m) => ({ default: m.ExploreExperience }));
});
export const ExploreSearchResultsPage = lazy(() =>
  import('../explore/search/ExploreSearchResultsPage').then((m) => ({ default: m.ExploreSearchResultsPage }))
);
export const BrowseListPage = lazy(() =>
  import('../list/BrowseListPage').then((m) => ({ default: m.BrowseListPage }))
);
export const NativeDeepLinkHandler = lazy(() =>
  import('../components/NativeDeepLinkHandler').then((m) => ({ default: m.NativeDeepLinkHandler }))
);
export const PlanBrowseRoute = lazy(() =>
  import('./planBrowseRoute').then((m) => ({ default: m.PlanBrowseRoute }))
);
// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
export const VenuePlaceDetailPage = lazy(() =>
  import('../pages/PlaceDetailPage').then((m) => ({ default: m.VenuePlaceDetailPage }))
);
export const CanonicalPlaceDetailPage = lazy(() =>
  import('../pages/PlaceDetailPage').then((m) => ({ default: m.CanonicalPlaceDetailPage }))
);
export const FacilityDetailPage = lazy(() =>
  import('../pages/FacilityDetailPage').then((m) => ({ default: m.FacilityDetailPage }))
);

export const ProfileProMembership = lazy(() =>
  import('../pages/ProfileProMembership').then((m) => ({ default: m.ProfileProMembership }))
);
export const ShopPublic = lazy(() => import('../pages/ShopPublic').then((m) => ({ default: m.ShopPublic })));
export const ActivityDetail = lazy(() => import('../pages/ActivityDetail').then((m) => ({ default: m.ActivityDetail })));
export const ActivityCrewPage = lazy(() =>
  import('../pages/ActivityCrewPage').then((m) => ({ default: m.ActivityCrewPage }))
);
export const TenantStorefrontPage = lazy(() =>
  import('../operator/public/TenantStorefrontPage').then((m) => ({ default: m.TenantStorefrontPage }))
);
export const MemberProfile = lazy(() => import('../pages/MemberProfile').then((m) => ({ default: m.MemberProfile })));
export const SignUp = lazy(() => import('../pages/SignUp').then((m) => ({ default: m.SignUp })));
export const SignIn = lazy(() => import('../pages/SignIn').then((m) => ({ default: m.SignIn })));
export const VerifyOTP = lazy(() => import('../pages/VerifyOTP').then((m) => ({ default: m.VerifyOTP })));
export const WelcomeSignup = lazy(() => import('../pages/WelcomeSignup').then((m) => ({ default: m.WelcomeSignup })));
export const ProfileGuide = lazy(() => import('../pages/ProfileGuide').then((m) => ({ default: m.ProfileGuide })));
export const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
export const AdminInbox = lazy(() => import('../pages/admin/Inbox').then((m) => ({ default: m.Inbox })));
export const AdminSubmissions = lazy(() =>
  import('../pages/admin/Submissions').then((m) => ({ default: m.Submissions }))
);
export const AdminPlaces = lazy(() => import('../pages/admin/Places').then((m) => ({ default: m.Places })));
export const AdminDestinations = lazy(() => import('../pages/admin/Destinations').then((m) => ({ default: m.AdminDestinations })));
export const DestinationDetailPage = lazy(() =>
  import('../pages/DestinationDetailPage').then((m) => ({ default: m.DestinationDetailPage }))
);
export const AdminOrganisations = lazy(() =>
  import('../pages/admin/Operators').then((m) => ({ default: m.Organisations }))
);
export const AdminActivities = lazy(() => import('../pages/admin/Activities').then((m) => ({ default: m.Activities })));
export const AdminMembers = lazy(() => import('../pages/admin/Members').then((m) => ({ default: m.Members })));
export const AdminGroups = lazy(() => import('../pages/admin/Groups').then((m) => ({ default: m.Groups })));
export const AdminCommunities = lazy(() =>
  import('../pages/admin/Communities').then((m) => ({ default: m.Communities }))
);
export const AdminAuditLog = lazy(() => import('../pages/admin/AuditLog').then((m) => ({ default: m.AuditLog })));
export const AdminReports = lazy(() => import('../pages/admin/Reports').then((m) => ({ default: m.Reports })));
export const AdminSettings = lazy(() => import('../pages/admin/Settings').then((m) => ({ default: m.Settings })));
export const AdminAccount = lazy(() => import('../pages/admin/Account').then((m) => ({ default: m.Account })));
export const AdminNotifications = lazy(() =>
  import('../pages/admin/Notifications').then((m) => ({ default: m.Notifications }))
);
export const AdminAlerts = lazy(() => import('../pages/admin/Alerts').then((m) => ({ default: m.Alerts })));
export const GeoTreePage = lazy(() => import('../pages/GeoTreePage').then((m) => ({ default: m.GeoTreePage })));
export const GeoCountryPage = lazy(() =>
  import('../pages/GeoCountryPage').then((m) => ({ default: m.GeoCountryPage }))
);
export const GeoNodePage = lazy(() => import('../pages/GeoNodePage').then((m) => ({ default: m.GeoNodePage })));
export const PlanTodayPage = lazy(() => import('../plan/PlanTodayPage').then((m) => ({ default: m.PlanTodayPage })));
export const PublishingOverview = lazy(() =>
  import('../operator/desk/Overview').then((m) => ({ default: m.Overview }))
);
export const PublishingActivities = lazy(() =>
  import('../operator/desk/Activities').then((m) => ({ default: m.Activities }))
);
export const PublishingJoinRequests = lazy(() =>
  import('../operator/desk/JoinRequests').then((m) => ({ default: m.JoinRequests }))
);
export const PublishingTeam = lazy(() => import('../operator/desk/Team').then((m) => ({ default: m.Team })));
export const PublishingPublicProfileEdit = lazy(() =>
  import('../operator/desk/PublicProfileEdit').then((m) => ({ default: m.PublicProfileEdit }))
);
export const PublishingPlaces = lazy(() => import('../operator/desk/Places').then((m) => ({ default: m.Places })));
export const PublishingHistory = lazy(() => import('../operator/desk/History').then((m) => ({ default: m.History })));
export const UserRequests = lazy(() => import('../pages/UserRequests').then((m) => ({ default: m.UserRequests })));
export const MessagesGate = lazy(() => import('../pages/Messages').then((m) => ({ default: m.MessagesGate })));
export const ProfileHistoryPage = lazy(() =>
  import('../pages/ProfileHistory').then((m) => ({ default: m.ProfileHistoryPage }))
);
export const JourneyMapPage = lazy(() =>
  import('../pages/JourneyMapPage').then((m) => ({ default: m.JourneyMapPage }))
);
export const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })));
export const ProfileSettings = lazy(() => import('../pages/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
export const ProfileSettingsDisplay = lazy(() =>
  import('../pages/ProfileSettingsDisplay').then((m) => ({ default: m.ProfileSettingsDisplay }))
);
export const ProfileSettingsAccount = lazy(() =>
  import('../pages/ProfileSettingsAccount').then((m) => ({ default: m.ProfileSettingsAccount }))
);
export const ProfileSettingsPrivacy = lazy(() =>
  import('../pages/ProfileSettingsPrivacy').then((m) => ({ default: m.ProfileSettingsPrivacy }))
);
export const ProfileSettingsNotifications = lazy(() =>
  import('../pages/ProfileSettingsNotifications').then((m) => ({ default: m.ProfileSettingsNotifications }))
);
export const ProfileSettingsSafety = lazy(() =>
  import('../pages/ProfileSettingsSafety').then((m) => ({ default: m.ProfileSettingsSafety }))
);
export const ProfileVehiclesPage = lazy(() =>
  import('../pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehiclesPage }))
);
export const ProfileVehicleNewPage = lazy(() =>
  import('../pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehicleNewPage }))
);
export const ProfileVehicleEditPage = lazy(() =>
  import('../pages/ProfileVehicles').then((m) => ({ default: m.ProfileVehicleEditPage }))
);
export const ProfileEdit = lazy(() => import('../pages/ProfileEdit').then((m) => ({ default: m.ProfileEdit })));
export const ProfileBadges = lazy(() => import('../pages/ProfileBadges').then((m) => ({ default: m.ProfileBadges })));
export const Submissions = lazy(() => import('../pages/Submissions').then((m) => ({ default: m.Submissions })));
export const ProfileReviews = lazy(() => import('../pages/ProfileReviews').then((m) => ({ default: m.ProfileReviews })));
export const JoinRequestDetail = lazy(() =>
  import('../pages/JoinRequestDetail').then((m) => ({ default: m.JoinRequestDetail }))
);
export const Groups = lazy(() => import('../pages/Groups').then((m) => ({ default: m.Groups })));
export const MyCrewsPage = lazy(() =>
  import('../pages/MyCrews').then((m) => ({ default: m.MyCrewsPage }))
);
export const CommunityClubDetailPage = lazy(() =>
  import('../pages/CommunityClubDetailPage').then((m) => ({ default: m.CommunityClubDetailPage }))
);
export const SecurityPrivacy = lazy(() =>
  import('../pages/SecurityPrivacy').then((m) => ({ default: m.SecurityPrivacy }))
);
export const Terms = lazy(() => import('../pages/Terms').then((m) => ({ default: m.Terms })));
export const Privacy = lazy(() => import('../pages/Privacy').then((m) => ({ default: m.Privacy })));
export const Faq = lazy(() => import('../pages/Faq').then((m) => ({ default: m.Faq })));
export const About = lazy(() => import('../pages/About').then((m) => ({ default: m.About })));
export const Contact = lazy(() => import('../pages/Contact').then((m) => ({ default: m.Contact })));
export const SiteMap = lazy(() => import('../pages/SiteMap').then((m) => ({ default: m.SiteMap })));
export const NotFound = lazy(() => import('../pages/NotFound').then((m) => ({ default: m.NotFound })));
