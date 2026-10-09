import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import { PLAN_PATH } from '../constants';

import { explorePath } from '../explore/routing';
import { useHostStatus } from '../hooks/useHostStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { signInPathForReturn } from '../utils/authReturnContext';
import { JoinedSection } from './activities/JoinedSection';
import { HostedActivitiesSection } from './activities/HostedActivitiesSection';
import { SelfPlansSection } from './activities/SelfPlansSection';
import { ActivitiesHubView } from './activities/ActivitiesHubView';
import { PlansUpcomingAllView } from './activities/PlansUpcomingAllView';
import { ProfileGoalCard } from '../components/profile/ProfileGoalCard';
import { ProfileGoalsSection } from '../components/profile/ProfileGoalsSection';
import { useMemberGoals } from '../hooks/useMemberGoals';
import { TripsPlansUpcomingHeader } from '../components/trips/TripsPlansUpcomingHeader';
import { PlanLensTabs } from '../components/plan/PlanLensTabs';
import { PlanSavedSection } from '../components/plan/PlanSavedSection';
import { PlanAvailabilitySection } from '../components/plan/PlanAvailabilitySection';
import { MY_TRIPS_PATH } from '../config/surfacePaths';
import { parsePlanLens, type PlanLens } from '../plan/planLens';
import {
  normalizeTripsSearchParams,
  parseTripsPlansRole,
  parseTripsSegment,
  type TripsPlansRole,
} from '../trips/tripsRouting';
import { resolveTripsContent, tripsContentShowsComposeFab } from '../trips/resolveTripsContent';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [goalAddSheet, setGoalAddSheet] = useState(false);
  const gate = useHostStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessHostConsole);
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
      navigate(qs ? `${MY_TRIPS_PATH}?${qs}` : `${MY_TRIPS_PATH}?view=completed`, { replace: true });
      return;
    }
    if (!user) return;
    const next = new URLSearchParams(searchParams);
    const { changed } = normalizeTripsSearchParams(next, canHost);
    if (changed) setSearchParams(next, { replace: true });
  }, [canHost, navigate, searchParams, setSearchParams, user]);

  const segment = parseTripsSegment(searchParams.get('segment'));
  const planLens = parsePlanLens(searchParams.get('lens'));
  const plansRole = parseTripsPlansRole(segment, searchParams.get('role'), canHost);

  const contentKey = resolveTripsContent({
    signedIn: Boolean(user),
    mainView: 'plans',
    plansRole,
    role: 'joined',
    canHost,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoals();
  }, [reloadGoals]);

  const setPlansRole = useCallback(
    (role: TripsPlansRole) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      next.delete('segment');
      if (role === 'all') {
        next.set('role', 'all');
      } else {
        next.set('role', role);
      }
      next.delete('saved');
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

  const showFab =
    planLens === 'schedule' && tripsContentShowsComposeFab(contentKey) && Boolean(user);

  const setPlanLens = useCallback(
    (lens: PlanLens) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      next.delete('segment');
      if (lens === 'schedule') {
        next.delete('lens');
        if (!next.get('role')) next.set('role', 'all');
      } else {
        next.set('lens', lens);
        next.delete('role');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const listSearchQuery = '';

  const renderContent = () => {
    if (!user) {
      return (
        <div className="glass-card p-6 text-center text-sm text-neutral-600">
          Sign in to see what you are planning next and track goals.
        </div>
      );
    }

    switch (contentKey) {
      case 'plans-all':
        return (
          <PlansUpcomingAllView refreshKey={refreshKey} canHost={canHost} />
        );
      case 'plans-joined':
        return (
          <>
            <ActivitiesHubView refreshKey={refreshKey} searchQuery={listSearchQuery} />
            <section aria-labelledby="plans-joined-seeking-heading" className="mt-6">
              <h2
                id="plans-joined-seeking-heading"
                className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400"
              >
                Seeking
              </h2>
              <SelfPlansSection
                segment="upcoming"
                refreshKey={refreshKey}
                searchQuery={listSearchQuery}
              />
            </section>
          </>
        );
      case 'plans-hosted':
        return (
          <HostedActivitiesSection
            refreshKey={refreshKey}
            searchQuery={listSearchQuery}
            timeScope="upcoming"
            layout="embedded"
          />
        );
      case 'joined-completed':
        return (
          <JoinedSection
            refreshKey={refreshKey}
            searchQuery={listSearchQuery}
            scope="attended-only"
          />
        );
      case 'hosted-completed':
        return (
          <HostedActivitiesSection
            refreshKey={refreshKey}
            searchQuery={listSearchQuery}
            timeScope="past"
          />
        );
      case 'self-completed':
        return (
          <SelfPlansSection
            segment="completed"
            refreshKey={refreshKey}
            searchQuery={listSearchQuery}
          />
        );
      case 'hosted-needs-approval':
        return (
          <div className="glass-card p-6 text-center">
            <p className="mb-3 text-sm text-neutral-600">
              Host activities on the map to share them with the community.
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
        title="Plan — your outings on UAE Trail"
        description="Upcoming and past outings you joined or host on UAE Trail."
        path={PLAN_PATH}
      />

      <ConsumerShell
        layout="tab"
        title="Plan"
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className={`space-y-4 pt-1 ${showFab ? 'pb-mobile-fab' : 'pb-bottom-nav-safe'}`}>
            {user ? (
              <>
                <PlanLensTabs active={planLens} onChange={setPlanLens} />
                {planLens === 'schedule' ? (
                  <TripsPlansUpcomingHeader
                    activeRole={plansRole}
                    onRoleChange={setPlansRole}
                    canHost={canHost}
                  />
                ) : null}
              </>
            ) : null}

            {planLens === 'saved' ? <PlanSavedSection /> : null}
            {planLens === 'calendar' && user ? (
              <p className="text-sm text-neutral-600">
                Calendar view is coming soon — use Schedule and Available for now.
              </p>
            ) : null}
            {planLens === 'availability' && user ? <PlanAvailabilitySection /> : null}
            {planLens === 'goals' && user ? (
              <>
                <ProfileGoalsSection
                  layout="trips"
                  goals={goals}
                  saving={goalSaving}
                  onCreateGoal={createGoal}
                  onUpdateGoal={updateGoal}
                  onDeleteGoal={deleteGoal}
                  onReloadGoals={reloadGoals}
                  openAddSheet={goalAddSheet}
                  onOpenAddSheetHandled={() => setGoalAddSheet(false)}
                />
                {primaryGoal ? (
                  <ProfileGoalCard
                    surfaceHidden
                    goal={primaryGoal}
                    saving={goalSaving}
                    onSave={(input) => updateGoal(primaryGoal.id, input)}
                    onClear={() => deleteGoal(primaryGoal.id)}
                    onReloadGoal={reloadGoals}
                    sheetOpen={goalSheetOpen}
                    onSheetOpenChange={setGoalSheetOpen}
                  />
                ) : null}
              </>
            ) : null}
            {planLens === 'schedule' ? renderContent() : null}
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
