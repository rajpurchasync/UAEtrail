import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import { ACTIVITIES_PATH } from '../constants';
import { EXPLORE_MAP_PATH } from '../config/platform';
import { isHostRole } from '../utils/roles';
import { exploreActivitiesPath, exploreOrganizePath } from '../utils/exploreRouting';
import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { parseTabParam, type PageTab } from './activities/shared';
import { JoinedSection } from './activities/JoinedSection';
import { HostedSection } from './activities/HostedSection';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PageTab>(() => parseTabParam(searchParams.get('tab'), user));
  const [refreshKey, setRefreshKey] = useState(0);
  const canHost = isHostRole(user?.role);

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

  const setTab = (tab: PageTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab !== 'joined') next.delete('sub');
    setSearchParams(next, { replace: true });
  };

  const navOptions = useMemo(() => {
    if (!user) return [];
    return [
      { key: 'joined' as PageTab, label: 'Joined' },
      ...(canHost ? [{ key: 'hosted' as PageTab, label: 'Hosted' }] : []),
    ];
  }, [user, canHost]);

  const handleHostCta = useCallback(() => {
    if (canHost) {
      navigate(exploreOrganizePath());
      return;
    }
    navigate('/become-host');
  }, [canHost, navigate]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <ConsumerShell
      layout="stack"
      title="My activities"
      showJourney={false}
      back={{ fallbackTo: EXPLORE_MAP_PATH, label: 'Explore' }}
      toolbar={
        navOptions.length > 1 ? (
          <FilterChips options={navOptions} value={activeTab} onChange={setTab} />
        ) : undefined
      }
    >
      <PageMeta
        title="My activities — joined and hosted"
        description="Activities you have joined or host on UAE Trail."
        path={ACTIVITIES_PATH}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mb-4">
          <Link
            to={exploreActivitiesPath()}
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {PRODUCT_EXPLORE_CTA}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="pb-24 md:pb-8">
          {activeTab === 'joined' && user && <JoinedSection refreshKey={refreshKey} />}
          {activeTab === 'hosted' && user && canHost && <HostedSection refreshKey={refreshKey} />}
          {activeTab === 'hosted' && user && !canHost && (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-neutral-600 mb-3">Host activities on the map to share them with the community.</p>
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

      {user && activeTab === 'hosted' && canHost && (
        <FloatingActionButton
          extended
          icon={<Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />}
          text="New activity"
          label="New activity"
          onClick={handleHostCta}
        />
      )}
    </ConsumerShell>
  );
};
