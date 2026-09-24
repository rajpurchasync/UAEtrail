import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { PageMeta } from '../components/seo/PageMeta';
import { ACTIVITIES_PATH } from '../constants';
import { explorePath } from '../explore/routing';
import { isHostRole } from '../utils/roles';
import { signInPathForReturn } from '../utils/authReturnContext';import { joinedSubViewTitle, parseTabParam, type PageTab } from './activities/shared';
import { ActivitiesHubView } from './activities/ActivitiesHubView';
import { JoinedSection } from './activities/JoinedSection';
import { HostedSection } from './activities/HostedSection';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PageTab>(() => parseTabParam(searchParams.get('tab'), user));
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const canHost = isHostRole(user?.role);
  const joinedSub = searchParams.get('sub');
  const showHub = activeTab === 'joined' && !joinedSub;

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab'), user));
  }, [searchParams, user]);

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

  const goHub = useCallback(() => {
    navigate('/activities?tab=joined');
  }, [navigate]);

  const handleOpenCompose = useCallback(() => {
    const composePath = explorePath({ compose: 'menu' });
    if (!user) {
      navigate(signInPathForReturn(composePath));
      return;
    }
    navigate(composePath);
  }, [navigate, user]);
  const showActivitiesSubNav = activeTab === 'hosted' || Boolean(joinedSubViewTitle(joinedSub));

  return (
    <div className="min-h-screen consumer-bg md:bg-gray-50">
      <PageMeta
        title="My activities — joined and hosted"
        description="Your upcoming outings, past trips, and hosted activities on UAE Trail."
        path={ACTIVITIES_PATH}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mx-auto w-full max-w-4xl px-4 pb-bottom-nav-safe sm:px-6 md:pb-8">
          {user ? (
            <TabPageSearchRow
              value={activitySearchQuery}
              onChange={setActivitySearchQuery}
              placeholder="Search activities"
            />
          ) : null}
          {showHub && user ? (
            <ActivitiesHubView
              refreshKey={refreshKey}
              canHost={canHost}
              searchQuery={activitySearchQuery}
            />
          ) : null}
          {showActivitiesSubNav && (
            <button
              type="button"
              onClick={goHub}
              className="mb-3 text-sm font-semibold text-emerald-700"
            >
              ← All activities
            </button>
          )}
          {activeTab === 'joined' && joinedSub && user ? (
            <JoinedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} />
          ) : null}
          {activeTab === 'hosted' && user && canHost ? (
            <HostedSection refreshKey={refreshKey} searchQuery={activitySearchQuery} />
          ) : null}
          {activeTab === 'hosted' && user && !canHost && (
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
          )}
        </div>
      </PullToRefresh>

      {showHub && user ? (
        <FloatingActionButton
          icon={<Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
          label="Add New"
          onClick={handleOpenCompose}
          className="md:hidden"
        />      ) : null}
    </div>
  );
};
