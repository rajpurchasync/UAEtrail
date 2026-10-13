import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import { PLAN_PATH } from '../constants';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import { explorePath } from '../explore/routing';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { signInPathForReturn } from '../utils/authReturnContext';
import { useMemberGoals } from '../hooks/useMemberGoals';
import { PlanGoalsProgressSummary } from '../components/plan/PlanGoalsProgressSummary';
import { PlanPageTabs } from '../components/plan/PlanPageTabs';
import { PlanUpcomingView } from '../components/plan/PlanUpcomingView';
import { PlanWishlistView } from '../components/plan/PlanWishlistView';
import { PROFILE_HISTORY_PATH } from '../config/surfacePaths';
import {
  normalizePlanMobileParams,
  parsePlanCommitmentFilter,
  parsePlanMainTab,
  parsePlanUpcomingLayout,
  type PlanCommitmentFilter,
  type PlanMainTab,
  type PlanUpcomingLayout,
} from '../plan/planTab';
import { normalizeTripsSearchParams } from '../member-plan/tripsRouting';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [goalAddSheet, setGoalAddSheet] = useState(false);
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);
  const {
    goals,
    primaryGoal,
    saving: goalSaving,
    createGoal,
    updateGoal,
    deleteGoal,
    reload: reloadGoals,
  } = useMemberGoals(Boolean(user));

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && view !== 'plans') {
      const qs = searchParams.toString();
      navigate(
        qs ? `${PROFILE_HISTORY_PATH}?${qs}` : `${PROFILE_HISTORY_PATH}?view=completed`,
        { replace: true }
      );
      return;
    }
    if (!user) return;
    const next = new URLSearchParams(searchParams);
    let { changed } = normalizeTripsSearchParams(next, canHost);
    const planNorm = normalizePlanMobileParams(next, canHost);
    changed = changed || planNorm.changed;
    if (changed) setSearchParams(next, { replace: true });
  }, [canHost, navigate, searchParams, setSearchParams, user]);

  const mainTab = parsePlanMainTab(searchParams.get('tab'), searchParams.get('lens'));
  const commitmentFilter = parsePlanCommitmentFilter(
    searchParams.get('filter'),
    searchParams.get('role'),
    canHost
  );
  const upcomingLayout = parsePlanUpcomingLayout(searchParams.get('layout'), searchParams.get('lens'));
  const lensRaw = searchParams.get('lens');

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoals();
  }, [reloadGoals]);

  const setMainTab = useCallback(
    (tab: PlanMainTab) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      next.delete('segment');
      next.delete('lens');
      next.delete('role');
      if (tab === 'wishlist') {
        next.set('tab', 'wishlist');
        next.delete('filter');
        next.delete('layout');
      } else {
        next.delete('tab');
        if (!next.get('filter')) next.set('filter', canHost ? 'hosting' : 'joined');
      }
      setSearchParams(next, { replace: true });
    },
    [canHost, searchParams, setSearchParams]
  );

  const setCommitmentFilter = useCallback(
    (filter: PlanCommitmentFilter) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      next.delete('tab');
      next.set('filter', filter);
      next.delete('role');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setUpcomingLayout = useCallback(
    (layout: PlanUpcomingLayout) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      if (layout === 'calendar') {
        next.set('layout', 'calendar');
      } else {
        next.delete('layout');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleOpenCompose = useCallback(() => {
    const composePath = explorePath({ compose: 'menu' });
    if (!user) {
      navigate(signInPathForReturn(composePath));
      return;
    }
    navigate(composePath);
  }, [navigate, user]);

  const showFab = mainTab === 'upcoming' && upcomingLayout === 'list' && Boolean(user);

  return (
    <>
      <PageMeta
        title={`${PRODUCT_PLAN_SURFACE_TITLE} — your outings on UAE Trail`}
        description="What you are planning next — joined, hosting, and looking for company on UAE Trail."
        path={PLAN_PATH}
      />

      <ConsumerShell
        layout="tab"
        title={PRODUCT_PLAN_SURFACE_TITLE}
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className={`space-y-4 pt-1 ${showFab ? 'pb-mobile-fab' : 'pb-bottom-nav-safe'}`}>
            {user ? (
              <>
                <PlanGoalsProgressSummary
                  primaryGoal={primaryGoal}
                  saving={goalSaving}
                  onSaveGoal={(input) =>
                    primaryGoal ? updateGoal(primaryGoal.id, input) : createGoal(input)
                  }
                  onClearGoal={() =>
                    primaryGoal ? deleteGoal(primaryGoal.id) : Promise.resolve()
                  }
                  onReloadGoals={reloadGoals}
                />
                <PlanPageTabs active={mainTab} onChange={setMainTab} />
                {mainTab === 'upcoming' ? (
                  <PlanUpcomingView
                    refreshKey={refreshKey}
                    canHost={canHost}
                    filter={commitmentFilter}
                    layout={upcomingLayout}
                    lensRaw={lensRaw}
                    onFilterChange={setCommitmentFilter}
                    onLayoutChange={setUpcomingLayout}
                  />
                ) : (
                  <PlanWishlistView
                    refreshKey={refreshKey}
                    goals={goals}
                    saving={goalSaving}
                    onCreateGoal={createGoal}
                    onUpdateGoal={updateGoal}
                    onDeleteGoal={deleteGoal}
                    onReloadGoals={reloadGoals}
                    openAddSheet={goalAddSheet}
                    onOpenAddSheetHandled={() => setGoalAddSheet(false)}
                  />
                )}
              </>
            ) : (
              <div className="glass-card p-6 text-center text-sm text-neutral-600">
                Sign in to see what you are planning next and track goals.
              </div>
            )}
          </div>
        </PullToRefresh>
      </ConsumerShell>

      {showFab ? (
        <FloatingActionButton
          icon={<Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
          label="Add New"
          onClick={handleOpenCompose}
          className="md:hidden"
        />
      ) : null}
    </>
  );
};
