import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivityFormSession } from '../context/ActivityFormSessionContext';
import { getActiveTenantId } from '../api/tenant';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PageMeta } from '../components/seo/PageMeta';
import { PAGE_BANNERS } from '../config/pageBanners';
import { ACTIVITIES_PATH } from '../constants';
import { isHostRole } from '../utils/roles';
import { parseActivityTypeParam } from '../config/activityTypes';
import { parseTabParam, type PageTab } from './activities/shared';
import { ExploreSection } from './activities/ExploreSection';
import { JoinedSection } from './activities/JoinedSection';
import { HostedSection } from './activities/HostedSection';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PageTab>(() => parseTabParam(searchParams.get('tab'), user));
  const { openCreate, setOnSaved } = useActivityFormSession();
  const canHost = isHostRole(user?.role);

  useEffect(() => {
    setOnSaved(() => () => {
      setActiveTab('hosted');
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'hosted');
      setSearchParams(next, { replace: true });
    });
    return () => setOnSaved(null);
  }, [searchParams, setSearchParams, setOnSaved]);

  useEffect(() => {
    const createType = parseActivityTypeParam(searchParams.get('create'));
    if (createType) {
      openCreate({ tenantId: getActiveTenantId() ?? '', initialActivityType: createType });
    }
  }, [searchParams, openCreate]);

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
    if (tab === 'explore') {
      next.delete('tab');
      next.delete('sub');
    } else {
      next.set('tab', tab);
      if (tab !== 'joined') next.delete('sub');
    }
    setSearchParams(next, { replace: true });
  };

  const navOptions = useMemo(() => {
    if (!user) return [{ key: 'explore' as PageTab, label: 'Explore' }];
    return [
      { key: 'joined' as PageTab, label: 'Joined' },
      ...(canHost ? [{ key: 'hosted' as PageTab, label: 'Hosted' }] : []),
      { key: 'explore' as PageTab, label: 'Explore' },
    ];
  }, [user, canHost]);

  const handleHostCta = useCallback(() => {
    if (canHost) {
      openCreate({ tenantId: getActiveTenantId() ?? '' });
      return;
    }
    navigate('/become-host');
  }, [canHost, navigate, openCreate]);

  return (
    <ConsumerShell
      layout="tab"
      title="Activities"
      banner={{ src: PAGE_BANNERS.trips, alt: 'Hikers on a mountain trail' }}
      journey={{ fallbackTo: '/', label: 'Home' }}
      toolbar={
        navOptions.length > 1 ? (
          <FilterChips options={navOptions} value={activeTab} onChange={setTab} />
        ) : undefined
      }
    >
      <PageMeta
        title="Activities — explore & join outdoor adventures"
        description="Browse hiking, camping, and events across the UAE."
        path={ACTIVITIES_PATH}
      />

      <div className="pb-24 md:pb-8">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'joined' && user && <JoinedSection />}
        {activeTab === 'hosted' && user && canHost && <HostedSection />}
        {activeTab === 'hosted' && user && !canHost && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-neutral-600 mb-3">Host activities on the map to share trips with the community.</p>
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
