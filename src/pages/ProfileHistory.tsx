import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import {
  JOURNEY_MAP_PATH,
  PLAN_PATH,
  PROFILE_HISTORY_PATH,
  isProfileHistoryListPath,
} from '../config/surfacePaths';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { JoinedSection } from './activities/JoinedSection';
import { HostedActivitiesSection } from './activities/HostedActivitiesSection';
import { SelfPlansSection } from './activities/SelfPlansSection';
import { ProfileHistoryPageToolbar } from '../components/profile-history/ProfileHistoryPageToolbar';
import { ProfileHistoryFiltersSheet } from '../components/profile-history/ProfileHistoryFiltersSheet';
import { useMemberGoals } from '../hooks/useMemberGoals';
import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';
import {
  normalizePlanHubSearchParams,
  parsePlanHistoryMainView,
  parsePlanHistoryRole,
  type PlanHistoryRole,
} from '../member-plan/planHubRouting';
import { resolvePlanHubView } from '../member-plan/resolvePlanHubView';

/** Profile outing history list — `/profile/history`. */
export const ProfileHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);
  const { goals, reload: reloadGoals } = useMemberGoals(Boolean(user));

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'plans') {
      const qs = searchParams.toString();
      navigate(qs ? `${PLAN_PATH}?${qs}` : PLAN_PATH, { replace: true });
      return;
    }
    if (view === 'map') {
      const qs = searchParams.toString();
      navigate(qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH, { replace: true });
      return;
    }
    if (!user) return;
    const next = new URLSearchParams(searchParams);
    const { changed } = normalizePlanHubSearchParams(next, canHost);
    let shouldReplace = changed;
    if (!next.get('view') && isProfileHistoryListPath(location.pathname)) {
      next.set('view', 'completed');
      shouldReplace = true;
    }
    if (shouldReplace) setSearchParams(next, { replace: true });
  }, [canHost, location.pathname, navigate, searchParams, setSearchParams, user]);

  const mainView = parsePlanHistoryMainView(location.pathname, searchParams.get('view'));
  const historyRole: PlanHistoryRole = parsePlanHistoryRole(searchParams.get('role'), 'completed', {
    canHost,
    legacyTab: searchParams.get('tab'),
  });

  const contentKey = resolvePlanHubView({
    signedIn: Boolean(user),
    mainView: 'completed',
    plansRole: 'all',
    role: historyRole,
    canHost,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoals();
  }, [reloadGoals]);

  const setHistoryRole = useCallback(
    (role: PlanHistoryRole) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'completed');
      next.set('role', role);
      next.delete('segment');
      next.delete('saved');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const historyToolbar = user ? (
    <ProfileHistoryPageToolbar
      surface="history"
      mainView={mainView === 'map' ? 'completed' : mainView}
      searchQuery={activitySearchQuery}
      onSearchChange={setActivitySearchQuery}
      searchPlaceholder="Search past outings"
      filtersActive={false}
      onOpenFilters={() => setFiltersOpen(true)}
      historyRole={historyRole}
      onHistoryRoleChange={setHistoryRole}
      canHost={canHost}
    />
  ) : null;

  const renderContent = () => {
    if (!user) {
      return (
        <div className="glass-card p-6 text-center text-sm text-neutral-600">
          Sign in to see outings you hosted, joined, or logged on your map.
        </div>
      );
    }

    switch (contentKey) {
      case 'joined-completed':
        return (
          <JoinedSection
            refreshKey={refreshKey}
            searchQuery={activitySearchQuery}
            scope="attended-only"
          />
        );
      case 'hosted-completed':
        return (
          <HostedActivitiesSection
            refreshKey={refreshKey}
            searchQuery={activitySearchQuery}
            timeScope="past"
          />
        );
      case 'self-completed':
        return (
          <SelfPlansSection
            segment="completed"
            refreshKey={refreshKey}
            searchQuery={activitySearchQuery}
          />
        );
      case 'hosted-needs-approval':
        return (
          <div className="glass-card p-6 text-center">
            <p className="mb-3 text-sm text-neutral-600">
              Organize outings on the map to share them with the community.
            </p>
            <button
              type="button"
              onClick={() => navigate(PRO_MEMBERSHIP_PATH)}
              className="text-sm font-semibold text-emerald-700"
            >
              Pro Membership
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta
        title="Outing history — UAE Trail"
        description="Outings you joined, hosted, or logged — plus your journey map."
        path={PROFILE_HISTORY_PATH}
      />

      <ConsumerShell
        layout="tab"
        title="History"
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
        toolbar={historyToolbar}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4 pt-1 pb-bottom-nav-safe">{renderContent()}</div>
        </PullToRefresh>
      </ConsumerShell>

      {user ? (
        <ProfileHistoryFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          hasActiveGoal={goals.length > 0}
          onOpenGoal={() => setFiltersOpen(false)}
        />
      ) : null}
    </>
  );
};
