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
import { MineSection } from './activities/MineSection';

const HOST_ACTIVITIES_PATH = '/host/activities';

export const Activities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PageTab>(() => parseTabParam(searchParams.get('tab'), user));
  const { openCreate, setOnSaved } = useActivityFormSession();
  const canHost = isHostRole(user?.role);

  useEffect(() => {
    if (searchParams.get('tab') === 'organized' && canHost) {
      navigate(HOST_ACTIVITIES_PATH, { replace: true });
    }
  }, [searchParams, canHost, navigate]);

  useEffect(() => {
    setOnSaved(() => () => {
      if (canHost) navigate(HOST_ACTIVITIES_PATH);
    });
    return () => setOnSaved(null);
  }, [canHost, navigate, setOnSaved]);

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
    if (tab === 'mine' || tab === 'joined') {
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
      if (tab !== 'mine') next.delete('sub');
    }
    setSearchParams(next, { replace: true });
  };

  const navOptions = useMemo(
    () => [
      { key: 'explore' as PageTab, label: 'Explore' },
      ...(user ? [{ key: 'mine' as PageTab, label: 'Dashboard' }] : []),
    ],
    [user]
  );

  const handleHostCta = useCallback(() => {
    navigate(canHost ? HOST_ACTIVITIES_PATH : '/become-host');
  }, [canHost, navigate]);

  return (
    <ConsumerShell
      layout="tab"
      title="Activities"
      banner={{ src: PAGE_BANNERS.trips, alt: 'Hikers on a mountain trail' }}
      toolbar={
        navOptions.length > 1 ? (
          <FilterChips options={navOptions} value={activeTab} onChange={setTab} />
        ) : undefined
      }
    >
      <PageMeta
        title="Activities — explore & join outdoor adventures"
        description="Browse hiking, camping, and outdoor activities across the UAE."
        path={ACTIVITIES_PATH}
      />

      <div className="pb-24 md:pb-8">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'mine' && user && <MineSection onExplore={() => setTab('explore')} />}
      </div>

      <FloatingActionButton
        extended
        icon={<Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />}
        text={canHost ? 'Host activity' : 'Become a host'}
        label={canHost ? 'Host activity' : 'Become a host'}
        onClick={handleHostCta}
      />
    </ConsumerShell>
  );
};
