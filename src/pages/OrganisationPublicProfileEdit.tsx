import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/index';
import { setStoredSession } from '../api/client';
import { getActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { TenantSwitcher } from '../components/ui';
import { OrganisationPublicProfile } from '../components/organisation-console/OrganisationPublicProfile';
import { OrganisationConsoleShell } from '../components/organisation-console/OrganisationConsoleShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { HOST_PROFILE_PATH, signInPath } from '../config/routingCatalog';
import { accountRouteByRole } from '../utils/authRouting';

export const OrganisationPublicProfileEdit = () => {
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
      <div className="flex min-h-[40vh] items-center justify-center consumer-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to={signInPath({ redirect: HOST_PROFILE_PATH })} replace state={{ from: HOST_PROFILE_PATH }} />
    );
  }

  return (
    <OrganisationConsoleShell
      title="Public profile"
      headerExtra={<TenantSwitcher onChange={(tenantId) => resolveSlug(tenantId)} />}
    >
      <GlassCard padding className="mb-3 border border-emerald-100/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Role mode</p>
            <p className="mt-1 text-xs text-neutral-600">Switch to participant mode to browse and book activities.</p>
          </div>
          <button
            type="button"
            disabled={switchingRole}
            onClick={() => void switchToVisitorMode()}
            className="ios-btn min-h-[40px] bg-emerald-600 px-3 text-white"
          >
            {switchingRole ? 'Switching...' : 'Switch to participant'}
          </button>
        </div>
        {switchMessage && <p className="mt-2 text-xs text-red-600">{switchMessage}</p>}
      </GlassCard>

      {loadingTenants ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : !tenantSlug ? (
        <GlassCard padding className="py-10 text-center">
          <p className="text-neutral-600">Select a host profile to view your public profile.</p>
        </GlassCard>
      ) : (
        <OrganisationPublicProfile slug={tenantSlug} mode="owner" />
      )}
    </OrganisationConsoleShell>
  );
};
