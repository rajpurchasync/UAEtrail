import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/services';
import { setStoredSession } from '../api/client';
import { getActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { TenantSwitcher } from '../components/ui';
import { OrganizerPublicProfile } from '../components/organizer/OrganizerPublicProfile';
import { PAGE_BANNERS } from '../config/pageBanners';
import { GlassCard } from '../components/mobile/GlassCard';
import { accountRouteByRole } from '../utils/authRouting';
import { useNavigate } from 'react-router-dom';

export const OrganizerProfile = () => {
  const { user, initializing, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tenantSlug, setTenantSlug] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

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

  const switchToVisitorMode = async () => {
    setSwitchMessage(null);
    setSwitchingRole(true);
    try {
      const res = await api.switchMeRole('participant');
      setStoredSession(res.tokens);
      await refreshUser();
      navigate(accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]), { replace: true });
    } catch (err) {
      setSwitchMessage(err instanceof Error ? err.message : 'Failed to switch role');
    } finally {
      setSwitchingRole(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen consumer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: '/host/profile' }} />;
  }

  return (
    <ConsumerShell
      layout="tab"
      title="Organizer profile"
      banner={{ src: PAGE_BANNERS.organizer, alt: 'Organizer profile' }}
      toolbar={
        <div className="w-full flex items-center justify-start">
          <TenantSwitcher onChange={(tenantId) => resolveSlug(tenantId)} />
        </div>
      }
    >
      <GlassCard padding className="mb-3 border border-emerald-100/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Role mode</p>
            <p className="text-xs text-neutral-600 mt-1">
              Switch to participant mode to browse and book trips.
            </p>
          </div>
          <button
            type="button"
            disabled={switchingRole}
            onClick={() => void switchToVisitorMode()}
            className="ios-btn bg-emerald-600 text-white min-h-[40px] px-3"
          >
            {switchingRole ? 'Switching...' : 'Switch to participant'}
          </button>
        </div>
        {switchMessage && <p className="text-xs text-red-600 mt-2">{switchMessage}</p>}
      </GlassCard>

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
