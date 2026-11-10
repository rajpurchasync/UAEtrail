import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { useMySeekingPosts } from '../hooks/useMySeekingPosts';
import { useConsoleHubData } from '../console/useHubData';
import { useHostActivityManageActions } from '../hooks/useHostActivityManageActions';
import { PlanHostingManageSheets } from '../components/plan/PlanHostingManageSheets';
import { usePlanHostingManageDeepLink } from './usePlanHostingManageDeepLink';

type PlanHostingManageContextValue = {
  openManageActivity: (activity: ActivityDTO) => void;
  openManageIntent: (intent: ParticipantIntentDTO) => void;
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
  const { intents, refetch: refetchIntents } = useMySeekingPosts(canHost && active, refreshKey);

  useEffect(() => {
    if (!refreshKey || !active) return;
    void host.reload();
    void refetchIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when refreshKey bumps
  }, [active, refreshKey, host.reload, refetchIntents]);

  const { manageActivity, setManageActivity, manageIntent, setManageIntent } =
    usePlanHostingManageDeepLink({
      enabled: canHost && active,
      activities: host.activities,
      activitiesLoading: host.loading,
      intents,
    });

  if (!canHost || !active) {
    return <>{children}</>;
  }

  const value: PlanHostingManageContextValue = {
    openManageActivity: setManageActivity,
    openManageIntent: setManageIntent,
  };

  return (
    <PlanHostingManageContext.Provider value={value}>
      {children}
      <PlanHostingManageSheets
        tenantId={host.tenantId}
        pendingRequests={host.pendingRequests}
        actions={hostActions}
        onHostReload={host.reload}
        onIntentsChanged={() => void refetchIntents()}
        manageActivity={manageActivity}
        onManageActivityClose={() => setManageActivity(null)}
        manageIntent={manageIntent}
        onManageIntentClose={() => setManageIntent(null)}
      />
    </PlanHostingManageContext.Provider>
  );
};
