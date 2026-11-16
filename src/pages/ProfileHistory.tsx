import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../routing/productSearchMutation';
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
import { JoinedSection } from '../components/activity/JoinedSection';
import { HostedActivitiesSection } from '../components/activity/HostedActivitiesSection';
import { PlanAvailabilitySection } from '../components/plan/PlanAvailabilitySection';
import { ProfileHistoryPageToolbar } from '../components/profile-history/ProfileHistoryPageToolbar';
import { ProfileHistoryFiltersSheet } from '../components/profile-history/ProfileHistoryFiltersSheet';
import { useMemberGoals } from '../hooks/useMemberGoals';
import {
  PRO_MEMBERSHIP_PATH,
  normalizePlanHubSearchParams,
  parsePlanHistoryMainView,
  parsePlanHistoryRole,
  type PlanHistoryRole,
} from '../config/routingCatalog';
import { mobileBackNavState } from '../utils/mobileBackNav';
import { resolveProfileHistoryContentKey } from '../member-plan/resolvePlanHubView';

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
  const historySearchKey = searchParams.toString();

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
    const draft = new URLSearchParams(searchParams);
    if (!draft.get('view') && isProfileHistoryListPath(location.pathname)) {
      draft.set('view', 'completed');
    }
    const { changed } = normalizePlanHubSearchParams(draft, canHost);
    if (!changed && draft.toString() === historySearchKey) return;
    applyProductSearchMutation(
      { pathname: location.pathname, navigate, setSearchParams },
      (params) => {
        for (const key of [...params.keys()]) {
          params.delete(key);
        }
        draft.forEach((value, key) => params.set(key, value));
      }
    );
  }, [canHost, historySearchKey, location.pathname, navigate, searchParams, setSearchParams, user]);

  const mainView = parsePlanHistoryMainView(location.pathname, searchParams.get('view'));
  const historyRole: PlanHistoryRole = parsePlanHistoryRole(searchParams.get('role'), 'completed', {
    canHost,
    inboundTab: searchParams.get('tab'),
  });

  const contentKey = resolveProfileHistoryContentKey({
    signedIn: Boolean(user),
    role: historyRole,
    canHost,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoals();
  }, [reloadGoals]);

  const setHistoryRole = useCallback(
    (role: PlanHistoryRole) => {
      applyProductSearchMutation(
        { pathname: location.pathname, navigate, setSearchParams },
        (params) => {
          params.set('view', 'completed');
          params.set('role', role);
          params.delete('segment');
          params.delete('saved');
        }
      );
    },
    [location.pathname, navigate, setSearchParams]
  );

  const historyToolbar = user ? (
    <ProfileHistoryPageToolbar
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
        return <PlanAvailabilitySection />;
      case 'hosted-needs-approval':
        return (
          <div className="glass-card p-6 text-center">
            <p className="mb-3 text-sm text-neutral-600">
              Host outings on the map to share them with the community.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(PRO_MEMBERSHIP_PATH, {
                  state: mobileBackNavState(
                    `${PROFILE_HISTORY_PATH}${location.search}`,
                    'History'
                  ),
                })
              }
              className="text-sm font-semibold text-emerald-700"
            >
              Pro membership
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
