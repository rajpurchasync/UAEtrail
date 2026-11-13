import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConsoleHubSections, ConsoleShell, useConsoleHubData } from '../../console';
import { TenantSwitcher } from '../../components/ui';
import { GlassCard } from '../../components/mobile/GlassCard';
import { FloatingActionButton } from '../../components/mobile/FloatingActionButton';
import { LoadingRing } from '../../components/ui/loadingPrimitives';
import { navigateToExploreHost } from '../../explore/navigateExploreHost';
import { HostingModeSwitcher } from '../../components/hosting/HostingModeSwitcher';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { persistHostingSurfaceMode } from '../../hosting/hostingHubRouting';

export const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const host = useConsoleHubData();
  const { ownedProfiles, hostTiers } = useMemberStatus({ enabled: Boolean(user) });

  useEffect(() => {
    persistHostingSurfaceMode('workspace');
  }, []);

  const loading = host.loading;

  return (
    <>
      <ConsoleShell
        title="Overview"
        headerExtra={
          <div className="flex w-full flex-col gap-2">
            <HostingModeSwitcher
              active="workspace"
              ownedProfiles={ownedProfiles}
              hostTiers={hostTiers}
            />
            <TenantSwitcher onChange={(value) => host.setTenantId(value)} />
          </div>
        }
      >
        {host.error && !loading && (
          <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{host.error}</p>
            <button
              type="button"
              onClick={() => void host.reload()}
              className="mt-2 text-sm font-semibold text-emerald-600"
            >
              Retry
            </button>
          </GlassCard>
        )}

        {!host.tenantId && !loading && (
          <GlassCard padding className="mb-3 border-amber-200/50 bg-amber-50/50">
            <p className="text-sm text-amber-800">Select a publishing profile above to load your activities.</p>
          </GlassCard>
        )}

        <div className="space-y-3 animate-fade-up">
          {loading ? (
            <div className="flex justify-center py-8" role="status" aria-label="Loading">
              <LoadingRing size="md" />
            </div>
          ) : (
            <ConsoleHubSections
              activitiesCount={host.activities.length}
              pendingJoinRequests={host.pendingJoinRequests}
              upcomingActivitiesCount={host.upcomingActivitiesCount}
              pastActivitiesCount={host.pastActivitiesCount}
              upcomingActivities={[]}
              showUpcomingPreview={false}
              showConsoleLinks
            />
          )}
        </div>
      </ConsoleShell>

      <FloatingActionButton
        icon={<Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
        label="Add activity"
        extended
        text="Add activity"
        disabled={!host.tenantId}
        onClick={() => navigateToExploreHost(navigate)}
      />
    </>
  );
};
