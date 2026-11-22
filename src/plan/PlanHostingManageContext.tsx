import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useConsoleHubData } from '../console/useHubData';
import { useHostActivityManageActions } from '../hooks/useHostActivityManageActions';
import { PlanHostingManageSheets } from '../components/plan/PlanHostingManageSheets';
import { usePlanHostingManageDeepLink } from './usePlanHostingManageDeepLink';

type PlanHostingManageContextValue = {
  openManageActivity: (activity: ActivityDTO) => void;
};

const PlanHostingManageContext = createContext<PlanHostingManageContextValue | null>(null);

export const usePlanHostingManage = (): PlanHostingManageContextValue => {
  const ctx = useContext(PlanHostingManageContext);
  if (!ctx) {
    throw new Error('usePlanHostingManage must be used within PlanHostingManageProvider');
  }
  return ctx;
};

type PlanHostingManageProviderProps = {
  children: ReactNode;
  refreshKey?: number;
  canHost: boolean;
  /** Hosting filter on upcoming tab — loads console hub + sheets. */
  active: boolean;
  /** Desktop hosting hub — skip unscoped tenant activity list; scoped lists load separately. */
  scopedActivityLists?: boolean;
};

export const PlanHostingManageProvider = ({
  children,
  refreshKey = 0,
  canHost,
  active,
  scopedActivityLists = false,
}: PlanHostingManageProviderProps) => {
  const host = useConsoleHubData(canHost && active, { fetchActivities: !scopedActivityLists });
  const hostActions = useHostActivityManageActions(host.tenantId, host.reload);

  useEffect(() => {
    if (!refreshKey || !active) return;
    void host.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps
  }, [active, refreshKey, host.reload]);

  const { manageActivity, setManageActivity } = usePlanHostingManageDeepLink({
    enabled: canHost && active,
    activities: host.activities,
    activitiesLoading: host.loading,
  });

  if (!canHost || !active) {
    return <>{children}</>;
  }

  const value: PlanHostingManageContextValue = {
    openManageActivity: setManageActivity,
  };

  return (
    <PlanHostingManageContext.Provider value={value}>
      {children}
      <PlanHostingManageSheets
        tenantId={host.tenantId}
        actions={hostActions}
        pendingRequests={host.pendingRequests}
        onHostReload={host.reload}
        manageActivity={manageActivity}
        onManageActivityClose={() => setManageActivity(null)}
      />
    </PlanHostingManageContext.Provider>
  );
};