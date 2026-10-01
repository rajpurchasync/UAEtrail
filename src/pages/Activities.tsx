import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { FormTabBar } from '../components/ui/FormTabBar';
import { PageMeta } from '../components/seo/PageMeta';
import { TRIPS_PATH } from '../constants';
import { explorePath } from '../explore/routing';
import { isHostRole } from '../utils/roles';
import { signInPathForReturn } from '../utils/authReturnContext';
import { joinedSubViewTitle, parseTabParam, type PageTab } from './activities/shared';
import { ActivitiesHubView } from './activities/ActivitiesHubView';
import { JoinedSection } from './activities/JoinedSection';
import { HostedSection } from './activities/HostedSection';
import { ProfileWishlistPanel } from '../components/trips/ProfileWishlistPanel';

type TripsSegment = 'upcoming' | 'past' | 'wishlist';

const parseSegment = (raw: string | null): TripsSegment => {
  if (raw === 'past' || raw === 'wishlist') return raw;
  return 'upcoming';
};

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PageTab>(() => parseTabParam(searchParams.get('tab'), user));
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const canHost = isHostRole(user?.role);
  const joinedSub = searchParams.get('sub');
  const segment = parseSegment(searchParams.get('segment'));
  const showUpcomingHub = segment === 'upcoming' && activeTab === 'joined' && !joinedSub;

  const segmentTabs = useMemo(
    () => [
      { id: 'upcoming', label: 'Upcoming' },
      { id: 'past', label: 'Past' },
      { id: 'wishlist', label: 'Wishlist' },
    ],
    []
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab'), user));
  }, [searchParams, user]);

  useEffect(() => {
    if (segment !== 'past' || joinedSub) return;
    const next = new URLSearchParams(searchParams);
    next.set('sub', 'attended');
    next.set('tab', 'joined');
    setSearchParams(next, { replace: true });
  }, [joinedSub, segment, searchParams, setSearchParams]);

  useEffect(() => {
    if (user) return;
    const tab = searchParams.get('tab');
    if (tab === 'joined' || tab === 'hosted' || tab === 'mine') {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      next.delete('sub');
      setSearchParams(next, { replace: true });
    }
  }, [user, searchParams, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
  }, []);

  const setSegment = useCallback(
    (nextSegment: TripsSegment) => {
      const next = new URLSearchParams(searchParams);
      next.set('segment', nextSegment);
      next.set('tab', 'joined');
      if (nextSegment === 'upcoming') {
        next.delete('sub');
      } else if (nextSegment === 'past') {
        next.set('sub', 'attended');
      } else {
        next.delete('sub');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const goHub = useCallback(() => {
    navigate(`${TRIPS_PATH}?segment=upcoming&tab=joined`);
  }, [navigate]);

  const handleOpenCompose = useCallback(() => {
    const composePath = explorePath({ compose: 'menu' });
    if (!user) {
      navigate(signInPathForReturn(composePath));
      return;
    }
    navigate(composePath);
  }, [navigate, user]);

  const showActivitiesSubNav =
    segment === 'upcoming' && (activeTab === 'hosted' || Boolean(joinedSubViewTitle(joinedSub)));

  return (
    <div className="min-h-screen consumer-bg md:bg-gray-50">
      <PageMeta
        title="My trips — upcoming, past, and saved map"
        description="Your upcoming outings, past trips, and wishlist on UAE Trail."
        path={TRIPS_PATH}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mx-auto w-full max-w-4xl px-4 pb-bottom-nav-safe sm:px-6 md:pb-8">
          {user ? (
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
                  to={explorePath({ myTrips: true, list: true })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-emerald-700 shadow-sm"
                  aria-label="Map view"
                  title="Map view"
                >
                  <MapIcon className="h-5 w-5" aria-hidden />
                </Link>
              </div>
              <FormTabBar tabs={segmentTabs} activeId={segment} onChange={(id) => setSegment(id as TripsSegment)} />
            </>
          ) : null}

          {segment === 'wishlist' && user ? <ProfileWishlistPanel key={refreshKey} /> : null}

          {showUpcomingHub && user ? (
            <div className="mt-3">
              <ActivitiesHubView
                refreshKey={refreshKey}
                canHost={canHost}
                searchQuery={activitySearchQuery}
              />
            </div>
          ) : null}

          {showActivitiesSubNav && (
            <button
              type="button"
              onClick={goHub}
              className="mb-3 mt-3 text-sm font-semibold text-emerald-700"
            >
              ← Upcoming
            </button>
          )}

          {segment === 'upcoming' && activeTab === 'joined' && joinedSub && user ? (
            <JoinedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} />
          ) : null}

          {segment === 'past' && user ? (
            <div className="mt-3">
              <JoinedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} />
            </div>
          ) : null}

          {segment === 'upcoming' && activeTab === 'hosted' && user && canHost ? (
            <HostedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} />
          ) : null}

          {segment === 'upcoming' && activeTab === 'hosted' && user && !canHost && (
            <div className="glass-card mt-3 p-6 text-center">
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
          )}
        </div>
      </PullToRefresh>

      {showUpcomingHub && user ? (
        <FloatingActionButton
          icon={<Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
          label="Add New"
          onClick={handleOpenCompose}
          className="md:hidden"
        />
      ) : null}
    </div>
  );
};
