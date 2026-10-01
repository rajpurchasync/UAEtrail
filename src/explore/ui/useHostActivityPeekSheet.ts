import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { buildExploreCardModel } from '../exploreCardModel';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { useQueryClient } from '@tanstack/react-query';
import { navigateToHostedActivityManage } from '../../host/navigateHostedActivityManage';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';

/** Host activity manage actions (message, cancel, check-in) — Explore map peek and hosted-activities list. */
export function useHostActivityPeekSheet(
  tenantId: string | null,
  onActivitiesChanged?: () => void | Promise<void>
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [peekItem, setPeekItem] = useState<ExploreMapItemDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hostRemoveConfirm, setHostRemoveConfirm] = useState<ActivityDTO | null>(null);
  const [hostRemoveBusy, setHostRemoveBusy] = useState(false);

  const peekCard = useMemo(() => {
    if (!peekItem) return null;
    const card = buildExploreCardModel(peekItem);
    return { ...card, showJoinActions: false, showHostActions: true };
  }, [peekItem]);

  const openActivityPeek = useCallback((activity: ActivityDTO) => {
    setPeekItem(buildExploreMapItemFromActivity(activity));
  }, []);

  const closePeek = useCallback(() => setPeekItem(null), []);

  const handleHostMessage = useCallback(async () => {
    const activity = peekItem?.activity;
    if (!activity) return;
    try {
      setPeekItem(null);
      await openActivityGroupChat(navigate, activity.id, activity.groupChatId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not open activity chat.');
    }
  }, [peekItem, navigate]);

  const handleHostManage = useCallback(() => {
    const activity = peekItem?.activity;
    if (!activity) return;
    setPeekItem(null);
    navigateToHostedActivityManage(navigate, activity.id, 'checkin');
  }, [peekItem, navigate]);

  const requestHostRemove = useCallback(() => {
    const activity = peekItem?.activity;
    if (!activity) return;
    if (activity.status !== 'draft' && activity.status !== 'published') return;
    setHostRemoveConfirm(activity);
  }, [peekItem?.activity]);

  const confirmHostRemove = useCallback(async () => {
    if (!hostRemoveConfirm || !tenantId) return;
    setHostRemoveBusy(true);
    try {
      await api.cancelOrganisationActivity(tenantId, hostRemoveConfirm.id);
      const wasDraft = hostRemoveConfirm.status === 'draft';
      setHostRemoveConfirm(null);
      setPeekItem(null);
      await reloadExploreMap(queryClient);
      await onActivitiesChanged?.();
      setNotice(wasDraft ? 'Draft deleted.' : 'Activity cancelled.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update activity.');
    } finally {
      setHostRemoveBusy(false);
    }
  }, [hostRemoveConfirm, tenantId, queryClient, onActivitiesChanged]);

  return {
    peekCard,
    peekOpen: Boolean(peekCard),
    notice,
    setNotice,
    openActivityPeek,
    closePeek,
    handleHostMessage,
    handleHostManage,
    requestHostRemove,
    hostRemoveConfirm,
    setHostRemoveConfirm,
    hostRemoveBusy,
    confirmHostRemove,
  };
}

export type HostActivityPeekController = ReturnType<typeof useHostActivityPeekSheet>;
