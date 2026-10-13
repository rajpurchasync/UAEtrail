import { useCallback, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import { exploreMapItemIsSeeking, type ActivityDTO, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { cancelHostActivityById } from '../../hooks/hostActivityClientApi';
import {
  cancelParticipantIntent,
  invalidateMyParticipantIntentsQueries,
} from '../../hooks/participantIntentClientApi';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { navigateToParticipantIntentManage } from '../../member-plan/navigateParticipantIntentManage';

/** Host cancel + demand intent remove flows on map peek (C18). */
export const useExploreSelectionRemovals = (input: {
  selected: ExploreMapItemDTO | null;
  tenantId: string | null | undefined;
  queryClient: QueryClient;
  navigate: NavigateFunction;
  setSelectedId: (id: string | null) => void;
  setDemandNotice: (message: string | null) => void;
  setVenueNotice: (message: string | null) => void;
}) => {
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);
  const [demandRemoveIntentId, setDemandRemoveIntentId] = useState<string | null>(null);
  const [demandRemoveBusy, setDemandRemoveBusy] = useState(false);

  const requestHostRemove = useCallback((activity: ActivityDTO) => {
    if (activity.status !== 'draft' && activity.status !== 'published') return;
    setHostRemoveConfirm(activity);
  }, []);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !input.tenantId) return;
    setHostRemoveBusy(true);
    try {
      await cancelHostActivityById(input.tenantId, hostRemoveConfirm.id);
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

  const handleDemandManage = useCallback(() => {
    const intentId = input.selected?.participantIntentId;
    if (!intentId || !exploreMapItemIsSeeking(input.selected)) return;
    input.setSelectedId(null);
    navigateToParticipantIntentManage(input.navigate, intentId);
  }, [input.selected, input.navigate, input.setSelectedId]);

  const requestDemandRemove = useCallback(() => {
    const intentId = input.selected?.participantIntentId;
    if (!intentId || !exploreMapItemIsSeeking(input.selected)) return;
    setDemandRemoveIntentId(intentId);
  }, [input.selected]);

  const confirmDemandRemove = useCallback(async () => {
    if (!demandRemoveIntentId) return;
    setDemandRemoveBusy(true);
    try {
      await cancelParticipantIntent(demandRemoveIntentId);
      invalidateMyParticipantIntentsQueries(input.queryClient);
      setDemandRemoveIntentId(null);
      input.setSelectedId(null);
      await reloadExploreMap(input.queryClient);
      input.setDemandNotice('Request removed from the map.');
    } catch (err) {
      input.setDemandNotice(err instanceof Error ? err.message : 'Could not remove this request.');
    } finally {
      setDemandRemoveBusy(false);
    }
  }, [demandRemoveIntentId, input.queryClient, input.setSelectedId, input.setDemandNotice]);

  return {
    hostRemoveConfirm,
    setHostRemoveConfirm,
    hostRemoveBusy,
    requestHostRemove,
    confirmHostRemove,
    demandRemoveIntentId,
    setDemandRemoveIntentId,
    demandRemoveBusy,
    handleDemandManage,
    requestDemandRemove,
    confirmDemandRemove,
  };
};
