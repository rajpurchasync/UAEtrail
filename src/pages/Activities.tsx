import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import { TRIPS_PATH } from '../constants';

import { explorePath } from '../explore/routing';
import { useHostStatus } from '../hooks/useHostStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { signInPathForReturn } from '../utils/authReturnContext';
import { JoinedSection } from './activities/JoinedSection';
import { HostedActivitiesSection } from './activities/HostedActivitiesSection';
import { SelfPlansSection } from './activities/SelfPlansSection';
import { ActivitiesHubView } from './activities/ActivitiesHubView';
import { PlansUpcomingAllView } from './activities/PlansUpcomingAllView';
import { ProfileWishlistPanel } from '../components/trips/ProfileWishlistPanel';
import { ProfileGoalCard } from '../components/profile/ProfileGoalCard';
import { useMemberGoal } from '../hooks/useMemberGoal';
import { TripsPageToolbar } from '../components/trips/TripsPageToolbar';
import { TripsPlansUpcomingHeader } from '../components/trips/TripsPlansUpcomingHeader';
import { TripsFiltersSheet } from '../components/trips/TripsFiltersSheet';
import {
  normalizeTripsSearchParams,
  parseTripsMainView,
  parseTripsPlansRole,
  parseTripsRole,
  parseTripsSavedLayer,
  parseTripsSegment,
  type TripsPlansRole,
  type TripsRole,
  type TripsSavedLayer,
} from '../trips/tripsRouting';
import { resolveTripsContent, tripsContentShowsComposeFab } from '../trips/resolveTripsContent';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const gate = useHostStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessHostConsole);
  const { goal, saving: goalSaving, saveGoal, clearGoal, reload: reloadGoal } = useMemberGoal(Boolean(user));

  useEffect(() => {
    if (!user) return;
    const next = new URLSearchParams(searchParams);
    const { changed } = normalizeTripsSearchParams(next, canHost);
    if (changed) setSearchParams(next, { replace: true });
  }, [canHost, searchParams, setSearchParams, user]);

  const mainView = parseTripsMainView(location.pathname, searchParams.get('view'));
  const segment = parseTripsSegment(searchParams.get('segment'));
  const plansRole = parseTripsPlansRole(segment, searchParams.get('role'), canHost);
  const savedLayer = parseTripsSavedLayer(searchParams.get('saved'));
  const historyRole: TripsRole =
    mainView === 'completed'
      ? parseTripsRole(searchParams.get('role'), 'completed', {
          canHost,
          legacyTab: searchParams.get('tab'),
        })
      : 'joined';

  const contentKey = resolveTripsContent({
    signedIn: Boolean(user),
    mainView,
    plansRole,
    role: historyRole,
    canHost,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoal();
  }, [reloadGoal]);

  const setPlansRole = useCallback(
    (role: TripsPlansRole) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      if (role === 'wishlist') {
        next.set('segment', 'wishlist');
        next.delete('role');
      } else {
        next.delete('segment');
        if (role === 'all') {
          next.set('role', 'all');
        } else {
          next.set('role', role);
        }
      }
      next.delete('saved');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setHistoryRole = useCallback(
    (role: TripsRole) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'completed');
      next.set('role', role);
      next.delete('segment');
      next.delete('saved');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setSavedLayer = useCallback(
    (nextLayer: TripsSavedLayer) => {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'plans');
      next.set('segment', 'wishlist');
      if (nextLayer === 'trips') {
        next.delete('saved');
      } else {
        next.set('saved', nextLayer);
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

  const showFab = tripsContentShowsComposeFab(contentKey) && Boolean(user);

  const filtersActive = false;

  const searchPlaceholder = 'Search completed trips';

  const listSearchQuery = mainView === 'completed' ? activitySearchQuery : '';

  const tripsToolbar = user ? (
    <TripsPageToolbar
      mainView={mainView}
      searchQuery={activitySearchQuery}
      onSearchChange={setActivitySearchQuery}
      searchPlaceholder={searchPlaceholder}
      filtersActive={filtersActive}
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
          Sign in to see your trips, hosted outings, and saved plans.
        </div>
      );
    }

    switch (contentKey) {
      case 'wishlist':
        return (
          <ProfileWishlistPanel
            key={`wishlist-${savedLayer}-${refreshKey}`}
            layer={savedLayer}
            searchQuery={listSearchQuery}
          />
        );
      case 'plans-all':
        return (
          <PlansUpcomingAllView refreshKey={refreshKey} canHost={canHost} />
        );
      case 'plans-joined':
        return (
          <>
            <ActivitiesHubView refreshKey={refreshKey} searchQuery={listSearchQuery} />
            <SelfPlansSection
              segment="upcoming"
              refreshKey={refreshKey}
              searchQuery={listSearchQuery}
              peekBridgeOnly
            />
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
        title="Trips — your outings on UAE Trail"
        description="Upcoming and past outings you joined or host on UAE Trail."
        path={TRIPS_PATH}
      />

      <ConsumerShell
        layout="tab"
        title="Trips"
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
        toolbar={tripsToolbar}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className={`space-y-4 pt-1 ${showFab ? 'pb-mobile-fab' : 'pb-bottom-nav-safe'}`}>
            {user && mainView === 'plans' ? (
              <>
                <ProfileGoalCard
                  variant="compact"
                  goal={goal}
                  saving={goalSaving}
                  onSave={saveGoal}
                  onClear={clearGoal}
                />
                <ProfileGoalCard
                  surfaceHidden
                  goal={goal}
                  saving={goalSaving}
                  onSave={saveGoal}
                  onClear={clearGoal}
                  sheetOpen={goalSheetOpen}
                  onSheetOpenChange={setGoalSheetOpen}
                />
                <TripsPlansUpcomingHeader
                  activeRole={plansRole}
                  onRoleChange={setPlansRole}
                  canHost={canHost}
                />
              </>
            ) : null}

            {renderContent()}
          </div>
        </PullToRefresh>
      </ConsumerShell>

      {user && mainView === 'completed' ? (
        <TripsFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          segment="completed"
          hasActiveGoal={Boolean(goal)}
          savedLayer={savedLayer}
          onSavedLayerChange={setSavedLayer}
          onOpenGoal={() => {
            setFiltersOpen(false);
            setGoalSheetOpen(true);
          }}
        />
      ) : null}

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
