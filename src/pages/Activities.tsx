import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { PageMeta } from '../components/seo/PageMeta';
import { TRIPS_PATH } from '../constants';
import { explorePath } from '../explore/routing';
import { isHostRole } from '../utils/roles';
import { signInPathForReturn } from '../utils/authReturnContext';
import { ActivitiesHubView } from './activities/ActivitiesHubView';
import { JoinedSection } from './activities/JoinedSection';
import { HostedSection } from './activities/HostedSection';
import { TripsSelfSection } from './activities/TripsSelfSection';
import { ProfileWishlistPanel } from '../components/trips/ProfileWishlistPanel';
import { ProfileGoalCard } from '../components/profile/ProfileGoalCard';
import { useMemberGoal } from '../hooks/useMemberGoal';
import { TripsSegmentScroll } from '../components/trips/TripsSegmentScroll';
import { TripsRoleChips } from '../components/trips/TripsRoleChips';
import {
  TRIPS_SEGMENT_TABS,
  normalizeTripsSearchParams,
  parseTripsRole,
  parseTripsSegment,
  tripsRoleChips,
  tripsMapPath,
  type TripsRole,
  type TripsSegment,
} from '../trips/tripsRouting';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const canHost = isHostRole(user?.role);
  const { goal, saving: goalSaving, saveGoal, clearGoal, reload: reloadGoal } = useMemberGoal(Boolean(user));

  useEffect(() => {
    if (!user) return;
    const next = new URLSearchParams(searchParams);
    const { changed } = normalizeTripsSearchParams(next, canHost);
    if (changed) setSearchParams(next, { replace: true });
  }, [canHost, searchParams, setSearchParams, user]);

  const segment = parseTripsSegment(searchParams.get('segment'));
  const role = parseTripsRole(searchParams.get('role'), segment, {
    canHost,
    legacyTab: searchParams.get('tab'),
  });

  const roleChips = useMemo(() => tripsRoleChips(segment, canHost), [canHost, segment]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    reloadGoal();
  }, [reloadGoal]);

  const setSegment = useCallback(
    (nextSegment: TripsSegment) => {
      const next = new URLSearchParams(searchParams);
      next.set('segment', nextSegment);
      if (nextSegment === 'wishlist') {
        next.delete('role');
      } else if (!next.get('role')) {
        next.set('role', 'joined');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setRole = useCallback(
    (nextRole: TripsRole) => {
      const next = new URLSearchParams(searchParams);
      next.set('role', nextRole);
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

  const showUpcomingJoinedHub = segment === 'upcoming' && role === 'joined';
  const showFab = showUpcomingJoinedHub && Boolean(user);

  const tripsToolbar = user ? (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TabPageSearchRow
            value={activitySearchQuery}
            onChange={setActivitySearchQuery}
            placeholder="Search trips"
          />
        </div>
        <Link
          to={tripsMapPath()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-emerald-700 shadow-sm"
          aria-label="My outdoor map"
          title="My outdoor map"
        >
          <MapIcon className="h-5 w-5" aria-hidden />
        </Link>
      </div>
      <TripsSegmentScroll tabs={TRIPS_SEGMENT_TABS} activeId={segment} onChange={setSegment} />
      {segment !== 'wishlist' ? (
        <div className="mt-3">
          <TripsRoleChips chips={roleChips} activeId={role} onChange={setRole} />
        </div>
      ) : null}
      {segment === 'upcoming' ? (
        <div className="mt-3">
          <ProfileGoalCard
            variant="compact"
            goal={goal}
            saving={goalSaving}
            onSave={saveGoal}
            onClear={clearGoal}
          />
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <>
      <PageMeta
        title="My trips — upcoming, completed, and wishlist"
        description="Your upcoming outings, completed trips, and wishlist on UAE Trail."
        path={TRIPS_PATH}
      />

      <ConsumerShell
        layout="tab"
        title="Trips"
        suppressMobileHeader
        maxWidth="4xl"
        toolbar={tripsToolbar}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-3 pb-bottom-nav-safe">
            {segment === 'wishlist' && user ? <ProfileWishlistPanel key={refreshKey} /> : null}

            {showUpcomingJoinedHub && user ? (
              <ActivitiesHubView refreshKey={refreshKey} searchQuery={activitySearchQuery} />
            ) : null}

            {segment === 'upcoming' && role === 'hosted' && user && canHost ? (
              <HostedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} timeScope="upcoming" />
            ) : null}

            {segment === 'upcoming' && role === 'hosted' && user && !canHost ? (
              <div className="glass-card p-6 text-center">
                <p className="mb-3 text-sm text-neutral-600">
                  Host activities on the map to share them with the community.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/become-host')}
                  className="text-sm font-semibold text-emerald-700"
                >
                  Become a host
                </button>
              </div>
            ) : null}

            {segment === 'upcoming' && role === 'self' && user ? (
              <TripsSelfSection segment="upcoming" />
            ) : null}

            {segment === 'completed' && role === 'joined' && user ? (
              <JoinedSection
                refreshKey={refreshKey}
                searchQuery={activitySearchQuery}
                scope="attended-only"
              />
            ) : null}

            {segment === 'completed' && role === 'hosted' && user && canHost ? (
              <HostedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} timeScope="past" />
            ) : null}

            {segment === 'completed' && role === 'hosted' && user && !canHost ? (
              <div className="glass-card p-6 text-center text-sm text-neutral-600">
                Hosting history is available after you become an approved host.
              </div>
            ) : null}

            {segment === 'completed' && role === 'self' && user ? (
              <TripsSelfSection segment="completed" />
            ) : null}
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
