import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  cancelActivity as cancelTenantActivity,
  duplicateActivity as duplicateTenantActivity,
  publishActivity as publishTenantActivity,
  resumeActivity as resumeTenantActivity,
  suspendActivity as suspendTenantActivity,
} from './tenantActivityClientApi';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { navigateToHostFromExistingActivity } from '../explore/navigateHostFromExistingActivity';
import { openPublishedActivityPreview } from '../components/activities';
import { useInvalidatePublishingWorkspace } from './publishingWorkspaceQueries';
import { useReloadExploreMap } from './useReloadExploreMap';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';

/** Tenant activity manage actions (`DELETE /publishing/activities/:id`, publish, duplicate, …). */
export function useHostActivityManageActions(
  tenantId: string | null,
  onActivitiesChanged?: () => void | Promise<void>
) {
  const navigate = useNavigate();
  const reloadExploreMap = useReloadExploreMap();
  const invalidateWorkspace = useInvalidatePublishingWorkspace(tenantId);
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityDTO | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<ActivityDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const afterChange = useCallback(async () => {
    invalidateWorkspace();
    await reloadExploreMap();
    await onActivitiesChanged?.();
  }, [invalidateWorkspace, onActivitiesChanged, reloadExploreMap]);

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
        navigateToHostFromExistingActivity(navigate, duplicate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not duplicate.');
      } finally {
        setBusy(false);
      }
    },
    [afterChange, navigate, tenantId]
  );

  const hostFromExistingActivity = useCallback(
    (activity: ActivityDTO) => {
      navigateToHostFromExistingActivity(navigate, activity);
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
      setError(
        err instanceof Error
          ? err.message
          : confirmDelete.status === 'suspended'
            ? 'Could not delete outing.'
            : 'Could not delete draft.'
      );
    } finally {
      setBusy(false);
    }
  }, [afterChange, confirmDelete, tenantId]);

  const confirmSuspendActivity = useCallback(async () => {
    if (!tenantId || !confirmSuspend) return;
    setBusy(true);
    setError(null);
    try {
      await suspendTenantActivity(tenantId, confirmSuspend.id);
      setConfirmSuspend(null);
      await afterChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suspend outing.');
    } finally {
      setBusy(false);
    }
  }, [afterChange, confirmSuspend, tenantId]);

  const resumeActivity = useCallback(
    async (activity: ActivityDTO): Promise<boolean> => {
      if (!tenantId) return false;
      setBusy(true);
      setError(null);
      try {
        await resumeTenantActivity(tenantId, activity.id);
        await afterChange();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not resume outing.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterChange, tenantId]
  );

  return {
    busy,
    error,
    setError,
    confirmCancel,
    setConfirmCancel,
    confirmDelete,
    setConfirmDelete,
    confirmSuspend,
    setConfirmSuspend,
    confirmCancelActivity,
    confirmDeleteDraft,
    confirmSuspendActivity,
    resumeActivity,
    openGroupChat,
    publishActivity,
    duplicateActivity,
    hostFromExistingActivity,
    createLinkedRideshare,
    previewPublished: openPublishedActivityPreview,
  };
}

export type HostActivityManageActions = ReturnType<typeof useHostActivityManageActions>;
