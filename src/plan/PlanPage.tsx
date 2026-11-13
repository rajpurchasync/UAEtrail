import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  PlanGoalsProgressSummary,
  type PlanSummaryFocus,
} from '../components/plan/PlanGoalsProgressSummary';
import { PlanPageTabs } from '../components/plan/PlanPageTabs';
import { PlanUpcomingView } from '../components/plan/PlanUpcomingView';
import { PlanWishlistView } from '../components/plan/PlanWishlistView';
import {
  HOSTING_HUB_PATH,
  JOURNEY_MAP_PATH,
  PLAN_TODAY_PATH,
  PROFILE_HISTORY_PATH,
} from '../config/surfacePaths';
import {
  parsePlanCommitmentFilter,
  parsePlanMainTab,
  parsePlanUpcomingLayout,
  type PlanCommitmentFilter,
  type PlanMainTab,
  type PlanUpcomingLayout,
} from './planTab';
import { normalizePlanSearchParams } from './planRouting';
import { scrollToPlanSummaryFocus } from './planSummaryFocusScroll';

/** My Plans tab — `/plan` (`PLAN_PATH`). */
export const PlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [goalAddSheet, setGoalAddSheet] = useState(false);
  const pendingSummaryFocusRef = useRef<PlanSummaryFocus | null>(null);
  const pendingSavedSummaryScrollRef = useRef(false);
  const [savedSummaryScrollRequest, setSavedSummaryScrollRequest] = useState(0);
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);
  const {
    goals,
    loading: goalsLoading,
    saving: goalSaving,
    createGoal,
    updateGoal,
    deleteGoal,
    reload: reloadGoals,
  } = useMemberGoals(Boolean(user));

  useEffect(() => {
    const view = searchParams.get('view');
    const filter = searchParams.get('filter');
    const role = searchParams.get('role');
    // Hosting is a dedicated surface — never render inside My Plans.
    if (filter === 'hosting' || role === 'hosted') {
      navigate(HOSTING_HUB_PATH, { replace: true });
      return;
    }
    // History + journey map live on profile — not the My Plans hub.
    if (view === 'map') {
      const qs = searchParams.toString();
      navigate(qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH, { replace: true });
      return;
    }
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
    const { changed } = normalizePlanSearchParams(next, canHost);
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
        if (!next.get('filter')) next.set('filter', 'joined');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
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

  const completeSavedSummaryScroll = useCallback(() => {
    if (!pendingSavedSummaryScrollRef.current) return;
    pendingSavedSummaryScrollRef.current = false;
    window.requestAnimationFrame(() => scrollToPlanSummaryFocus('saved'));
  }, []);

  const handleSummaryFocus = useCallback(
    (focus: PlanSummaryFocus) => {
      if (focus === 'hosting' && !canHost) return;

      const targetTab: PlanMainTab =
        focus === 'hosting' || focus === 'joined' ? 'upcoming' : 'wishlist';

      if (focus === 'hosting') {
        navigate(HOSTING_HUB_PATH);
        return;
      }

      if (focus === 'saved') {
        pendingSavedSummaryScrollRef.current = true;
        setSavedSummaryScrollRequest((n) => n + 1);
        if (mainTab !== targetTab) {
          setMainTab(targetTab);
        }
        return;
      }

      if (mainTab !== targetTab) {
        pendingSummaryFocusRef.current = focus;
        setMainTab(targetTab);
        return;
      }
      if (focus === 'joined' && commitmentFilter !== 'joined') {
        setCommitmentFilter('joined');
        return;
      }

      scrollToPlanSummaryFocus(focus);
    },
    [canHost, commitmentFilter, mainTab, navigate, setCommitmentFilter, setMainTab]
  );

  useEffect(() => {
    const focus = pendingSummaryFocusRef.current;
    if (!focus) return;
    pendingSummaryFocusRef.current = null;
    scrollToPlanSummaryFocus(focus);
  }, [mainTab]);

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
        description="What you are planning next — joined outings, wishlist, and goals on UAE Trail."
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
          <div
            className={`space-y-3 pt-0.5 md:space-y-1.5 ${
              showFab ? 'pb-mobile-fab' : 'pb-bottom-nav-safe'
            }`}
          >
            {user ? (
              <>
                <PlanGoalsProgressSummary
                  goals={goals}
                  goalsLoading={goalsLoading}
                  canHost={canHost}
                  refreshKey={refreshKey}
                  saving={goalSaving}
                  onCreateGoal={createGoal}
                  onReloadGoals={reloadGoals}
                  onSummaryFocus={handleSummaryFocus}
                />
                <PlanPageTabs active={mainTab} onChange={setMainTab} />
                <p className="px-1 text-sm">
                  <Link to={PLAN_TODAY_PATH} className="font-semibold text-emerald-800 hover:underline">
                    Today — next outing briefing
                  </Link>
                </p>
                {mainTab === 'upcoming' ? (
                  <PlanUpcomingView
                    refreshKey={refreshKey}
                    canHost={canHost}
                    filter={commitmentFilter === 'hosting' ? 'joined' : commitmentFilter}
                    layout={upcomingLayout}
                    lensRaw={lensRaw}
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
                    savedSummaryScrollRequest={savedSummaryScrollRequest}
                    onSavedSummaryScrollReady={completeSavedSummaryScroll}
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
