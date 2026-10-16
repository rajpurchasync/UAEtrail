import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  cancelActivity as cancelTenantActivity,
  duplicateActivity as duplicateTenantActivity,
  publishActivity as publishTenantActivity,
} from './tenantActivityClientApi';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { navigateToReorganizeActivity } from '../explore/navigateReorganizeActivity';
import { openPublishedActivityPreview } from '../components/activities';
import { useReloadExploreMap } from './useReloadExploreMap';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';

/** Tenant activity manage actions (`DELETE /operator/activities/:id`, publish, duplicate, …). */
export function useHostActivityManageActions(
  tenantId: string | null,
  onActivitiesChanged?: () => void | Promise<void>
) {
  const navigate = useNavigate();
  const reloadExploreMap = useReloadExploreMap();
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const afterChange = useCallback(async () => {
    await reloadExploreMap();
    await onActivitiesChanged?.();
  }, [onActivitiesChanged, reloadExploreMap]);

  const openGroupChat = useCallback(
    async (
      activityId: string,
      groupChatId?: string | null,
      options?: { returnTo?: string }
    ): Promise<boolean> => {
      setError(null);
      setBusy(true);
      try {
        await openActivityGroupChat(navigate, activityId, groupChatId, {
          returnTo: options?.returnTo,
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not open activity chat.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [navigate]
  );

  const publishActivity = useCallback(
    async (activityId: string): Promise<boolean> => {
      if (!tenantId) return false;
      setBusy(true);
      setError(null);
      try {
        await publishTenantActivity(tenantId, activityId);
        await afterChange();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not publish.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterChange, tenantId]
  );

  const duplicateActivity = useCallback(
    async (activity: ActivityDTO) => {
      if (!tenantId) return;
      setBusy(true);
      setError(null);
      try {
        const duplicate = await duplicateTenantActivity(tenantId, activity.id);
        await afterChange();
        navigateToReorganizeActivity(navigate, duplicate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not duplicate.');
      } finally {
        setBusy(false);
      }
    },
    [afterChange, navigate, tenantId]
  );

  const reorganizeActivity = useCallback(
    (activity: ActivityDTO) => {
      navigateToReorganizeActivity(navigate, activity);
    },
    [navigate]
  );

  const createLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      navigateToCreateLinkedRideshare(navigate, parent);
    },
    [navigate]
  );

  const confirmCancelActivity = useCallback(async () => {
    if (!tenantId || !confirmCancel) return;
    setBusy(true);
    setError(null);
    try {
      await cancelTenantActivity(tenantId, confirmCancel.id);
      setConfirmCancel(null);
      await afterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel activity.');
    } finally {
      setBusy(false);
    }
  }, [afterChange, confirmCancel, tenantId]);

  const confirmDeleteDraft = useCallback(async () => {
    if (!tenantId || !confirmDelete) return;
    setBusy(true);
    setError(null);
    try {
      await cancelTenantActivity(tenantId, confirmDelete.id);
      setConfirmDelete(null);
      await afterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete draft.');
    } finally {
      setBusy(false);
    }
  }, [afterChange, confirmDelete, tenantId]);

  return {
    busy,
    error,
    setError,
    confirmCancel,
    setConfirmCancel,
    confirmDelete,
    setConfirmDelete,
    confirmCancelActivity,
    confirmDeleteDraft,
    openGroupChat,
    publishActivity,
    duplicateActivity,
    reorganizeActivity,
    createLinkedRideshare,
    previewPublished: openPublishedActivityPreview,
  };
}

export type HostActivityManageActions = ReturnType<typeof useHostActivityManageActions>;
