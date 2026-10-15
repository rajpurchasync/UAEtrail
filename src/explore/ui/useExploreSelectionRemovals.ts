import { useCallback, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { cancelActivity } from '../../hooks/tenantActivityClientApi';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import type { ActivityManageInitialView } from '../../components/activity/activityManageViews';

/** Organizer cancel hosted/seeking activity from map context (C18). */
export const useExploreSelectionRemovals = (input: {
  tenantId: string | null | undefined;
  queryClient: QueryClient;
  setSelectedId: (id: string | null) => void;
  setVenueNotice: (message: string | null) => void;
  onOpenHostManage?: (activity: ActivityDTO, initialView?: ActivityManageInitialView) => void;
}) => {
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);

  const requestHostRemove = useCallback((activity: ActivityDTO) => {
    if (activity.status !== 'draft' && activity.status !== 'published') return;
    setHostRemoveConfirm(activity);
  }, []);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !input.tenantId) return;
    setHostRemoveBusy(true);
    try {
      await cancelActivity(input.tenantId, hostRemoveConfirm.id);
      const wasDraft = hostRemoveConfirm.status === 'draft';
      setHostRemoveConfirm(null);
      input.setSelectedId(null);
      await reloadExploreMap(input.queryClient);
      input.setVenueNotice(wasDraft ? 'Draft deleted.' : 'Activity cancelled.');
    } catch (err) {
      input.setVenueNotice(err instanceof Error ? err.message : 'Could not update activity.');
    } finally {
      setHostRemoveBusy(false);
    }
  }, [hostRemoveConfirm, input.tenantId, input.queryClient, input.setSelectedId, input.setVenueNotice]);

  return {
    hostRemoveConfirm,
    setHostRemoveConfirm,
    hostRemoveBusy,
    requestHostRemove,
    confirmHostRemove,
  };
};
