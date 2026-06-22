import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateTripModal } from '../components/ui';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { AppHeaderAction } from '../components/mobile/AppHeaderAction';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { PageMeta } from '../components/seo/PageMeta';
import { PAGE_BANNERS } from '../config/pageBanners';
import { isOrganizer, parseTabParam, type PageTab } from './trips/shared';
import { ExploreSection } from './trips/ExploreSection';
import { MineSection } from './trips/MineSection';
import { OrganizedSection } from './trips/OrganizedSection';

export const Trips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showOrganized = isOrganizer(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<PageTab>(() =>
    parseTabParam(searchParams.get('tab'), user, showOrganized)
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [organizedRefresh, setOrganizedRefresh] = useState(0);

  useEffect(() => {
    const tab = parseTabParam(searchParams.get('tab'), user, showOrganized);
    setActiveTab(tab);
  }, [searchParams, user, showOrganized]);

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
      ...(user ? [{ key: 'mine' as PageTab, label: 'Mine' }] : []),
      ...(showOrganized ? [{ key: 'organized' as PageTab, label: 'Organizing' }] : []),
    ],
    [user, showOrganized]
  );

  const handlePostEvent = useCallback(() => {
    if (showOrganized) {
      setShowCreateModal(true);
      return;
    }
    navigate('/become-host');
  }, [showOrganized, navigate]);

  return (
    <ConsumerShell
      layout="tab"
      title="Trips"
      banner={{ src: PAGE_BANNERS.trips, alt: 'Hikers on a mountain trail' }}
      action={
        showOrganized && activeTab === 'organized' ? (
          <AppHeaderAction icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreateModal(true)}>
            Create
          </AppHeaderAction>
        ) : undefined
      }
      toolbar={
        navOptions.length > 1 ? (
          <FilterChips options={navOptions} value={activeTab} onChange={setTab} />
        ) : undefined
      }
    >
      <PageMeta
        title="Trips — explore, join & manage adventures"
        description="Browse organized hiking and camping trips, track your requests and confirmed bookings, and manage events you host."
        path="/trips"
      />

      <div className="pb-24 md:pb-8">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'mine' && user && <MineSection onExplore={() => setTab('explore')} />}
        {activeTab === 'organized' && showOrganized && <OrganizedSection refreshKey={organizedRefresh} />}
      </div>

      <FloatingActionButton
        extended
        icon={<Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />}
        text="Post your next event"
        label="Post your next event"
        onClick={handlePostEvent}
      />

      <CreateTripModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setTab('organized');
          setOrganizedRefresh((k) => k + 1);
        }}
      />
    </ConsumerShell>
  );
};
