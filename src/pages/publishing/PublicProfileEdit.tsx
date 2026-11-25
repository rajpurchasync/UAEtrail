import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../hooks/accountSessionApi';
import { getActiveTenantId } from '../../api/tenant';
import { useAuth } from '../../context/AuthContext';
import { TenantSwitcher } from '../../components/ui';
import { OrganisationPublicProfile } from '../../components/organisation-console/OrganisationPublicProfile';
import { ConsoleShell } from '../../console/ConsoleShell';
import { GlassCard } from '../../components/mobile/GlassCard';
import { OPERATOR_PROFILE_PATH, signInPath } from '../../config/routingCatalog';
import { navigateToVisitorHome } from '../../hosting/navigateHostRoleHome';
import { useMyTenantMemberships } from '../../hooks/usePublishingConsoleQueries';

export const PublicProfileEdit = () => {
  const { user, initializing, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTenantId, setActiveTenantId] = useState(getActiveTenantId());
  const { data: memberships, isPending: loadingTenants } = useMyTenantMemberships();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  const tenantSlug = useMemo(() => {
    if (!memberships?.length) return '';
    const match = memberships.find((t) => t.tenantId === activeTenantId) ?? memberships[0];
    return match?.tenantSlug ?? '';
  }, [memberships, activeTenantId]);

  const switchToVisitorMode = async () => {
    setSwitchMessage(null);
    setSwitchingRole(true);
    try {
      const session = await switchMeRoleSession('participant');
      persistAuthSessionTokens(session.tokens);
      await refreshUser();
      navigateToVisitorHome(navigate);
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
      <Navigate
        to={signInPath({ redirect: OPERATOR_PROFILE_PATH })}
        replace
        state={{ from: OPERATOR_PROFILE_PATH }}
      />
    );
  }

  return (
    <ConsoleShell
      title="Public profile"
      headerExtra={<TenantSwitcher onChange={setActiveTenantId} />}
    >
      <GlassCard padding className="mb-3 border border-emerald-100/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Role mode</p>
            <p className="mt-1 text-xs text-neutral-600">
              Switch to visitor to explore the map and join outings.
            </p>
          </div>
          <button
            type="button"
            disabled={switchingRole}
            onClick={() => void switchToVisitorMode()}
            className="ios-btn min-h-[40px] bg-emerald-600 px-3 text-white"
          >
            {switchingRole ? 'Switching...' : 'Switch to Visitor'}
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
          <p className="text-neutral-600">Select a publishing profile to view your public profile.</p>
        </GlassCard>
      ) : (
        <OrganisationPublicProfile slug={tenantSlug} mode="owner" />
      )}
    </ConsoleShell>
  );
};