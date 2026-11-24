import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../routing/productSearchMutation';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PlanAddIntentSheet } from '../components/plan/PlanAddIntentSheet';
import { PlanWishlistPickSheet } from '../components/plan/PlanWishlistPickSheet';
import { PageMeta } from '../components/seo/PageMeta';
import { PLAN_PATH } from '../constants';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { useMemberGoals } from '../hooks/useMemberGoals';
import {
  PlanGoalsProgressSummary,
  type PlanSummaryFocus,
} from '../components/plan/PlanGoalsProgressSummary';
import { PlanPageTabs } from '../components/plan/PlanPageTabs';
import { PlanUpcomingView } from '../components/plan/PlanUpcomingView';
import { PlanWishlistView } from '../components/plan/PlanWishlistView';
import { JOURNEY_MAP_PATH, PLAN_TODAY_PATH, PROFILE_HISTORY_PATH } from '../config/surfacePaths';
import {
  parsePlanCalendarScope,
  parsePlanCommitmentFilter,
  parsePlanMainTab,
  parsePlanUpcomingLayout,
  type PlanCommitmentFilter,
  type PlanMainTab,
  type PlanUpcomingLayout,
} from './planTab';
import { normalizePlanSearchParams, planAvailabilityPath } from './planRouting';
import { PLAN_ADD_FAB_LABEL } from './planAdd';
import { scrollToPlanSummaryFocus } from './planSummaryFocusScroll';
import { usePlanAddFlow } from './usePlanAddFlow';

/** My Plans tab — `/plan` (`PLAN_PATH`). */
export const PlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const planAdd = usePlanAddFlow();
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

  const planSearchKey = searchParams.toString();

  useEffect(() => {
    if (searchParams.get('lens') === 'availability') {
      navigate(planAvailabilityPath(), { replace: true });
      return;
    }
    const view = searchParams.get('view');
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
    const draft = new URLSearchParams(searchParams);
    const { changed } = normalizePlanSearchParams(draft, canHost);
    if (!changed) return;
    applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
      for (const key of [...params.keys()]) {
        params.delete(key);
      }
      draft.forEach((value, key) => params.set(key, value));
    });
  }, [canHost, navigate, pathname, planSearchKey, setSearchParams, user]);

  const mainTab = parsePlanMainTab(searchParams.get('tab'));
  const commitmentFilter = parsePlanCommitmentFilter(searchParams.get('filter'), canHost);
  const upcomingLayout = parsePlanUpcomingLayout(searchParams.get('layout'));
  const calendarScope = parsePlanCalendarScope(
    searchParams.get('filter'),
    upcomingLayout,
    canHost
  );

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoals();
  }, [reloadGoals]);

  const setMainTab = useCallback(
    (tab: PlanMainTab) => {
      applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
        params.set('view', 'plans');
        params.delete('segment');
        params.delete('lens');
        params.delete('role');
        if (tab === 'wishlist') {
          params.set('tab', 'wishlist');
          params.delete('filter');
          params.delete('layout');
        } else {
          params.delete('tab');
          if (!params.get('filter')) params.set('filter', 'joined');
        }
      });
    },
    [navigate, pathname, setSearchParams]
  );

  const setCommitmentFilter = useCallback(
    (filter: PlanCommitmentFilter) => {
      applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
        params.set('view', 'plans');
        params.delete('tab');
        params.set('filter', filter);
        params.delete('role');
      });
    },
    [navigate, pathname, setSearchParams]
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
        setCommitmentFilter('hosting');
        if (mainTab !== 'upcoming') setMainTab('upcoming');
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
      applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
        params.set('view', 'plans');
        if (layout === 'calendar') {
          params.set('layout', 'calendar');
          const filter = params.get('filter');
          if (!filter || filter === 'joined') params.set('filter', 'all');
        } else params.delete('layout');
      });
    },
    [navigate, pathname, setSearchParams]
  );

  const showFab = Boolean(user);

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
                    calendarScope={calendarScope}
                    layout={upcomingLayout}
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
                    openAddSheet={planAdd.step === 'goal'}
                    onAddSheetOpenChange={(open) => {
                      if (!open) planAdd.close();
                    }}
                    savedSummaryScrollRequest={savedSummaryScrollRequest}
                    onSavedSummaryScrollReady={completeSavedSummaryScroll}
                    onAddWantToGo={() => planAdd.selectOption('wishlist')}
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
          label={PLAN_ADD_FAB_LABEL}
          onClick={planAdd.openMenu}
        />
      ) : null}

      <PlanAddIntentSheet
        open={planAdd.step === 'menu'}
        onSelect={planAdd.selectOption}
        onClose={planAdd.close}
      />
      <PlanWishlistPickSheet
        open={planAdd.step === 'wishlist'}
        onClose={planAdd.close}
      />
    </>
  );
};
