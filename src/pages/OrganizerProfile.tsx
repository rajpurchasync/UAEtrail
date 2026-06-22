import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { TenantSwitcher } from '../components/ui';
import { OrganizerPublicProfile } from '../components/organizer/OrganizerPublicProfile';
import { PAGE_BANNERS } from '../config/pageBanners';
import { GlassCard } from '../components/mobile/GlassCard';

export const OrganizerProfile = () => {
  const { user, initializing } = useAuth();
  const [tenantSlug, setTenantSlug] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(true);

  const resolveSlug = (tenantId?: string) => {
    setLoadingTenants(true);
    api
      .getMyTenants()
      .then((res) => {
        const activeId = tenantId || getActiveTenantId();
        const match = res.data.find((t) => t.tenantId === activeId) ?? res.data[0];
        setTenantSlug(match?.tenantSlug ?? '');
      })
      .catch(() => setTenantSlug(''))
      .finally(() => setLoadingTenants(false));
  };

  useEffect(() => {
    resolveSlug();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen consumer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: '/organizer/profile' }} />;
  }

  return (
    <ConsumerShell
      layout="tab"
      title="Organizer profile"
      banner={{ src: PAGE_BANNERS.organizer, alt: 'Organizer profile' }}
      toolbar={
        <div className="flex items-center justify-between gap-3">
          <MobileBackButton fallbackTo="/organizer/overview" label="Hub" />
          <TenantSwitcher onChange={(tenantId) => resolveSlug(tenantId)} />
        </div>
      }
    >
      {loadingTenants ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !tenantSlug ? (
        <GlassCard padding className="text-center py-10">
          <p className="text-neutral-600">Select an organization to view your public profile.</p>
        </GlassCard>
      ) : (
        <OrganizerPublicProfile slug={tenantSlug} mode="owner" />
      )}
    </ConsumerShell>
  );
};
