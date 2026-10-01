import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { useActivityFormSession } from '../context/ActivityFormSessionContext';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { navigateToReorganizeActivity } from '../explore/navigateReorganizeActivity';
import { openPublishedActivityPreview } from '../components/activities';
import { useReloadExploreMap } from './useReloadExploreMap';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';

export function useOrganisationActivityHostActions(
  tenantId: string | null,
  onActivitiesChanged?: () => void | Promise<void>
) {
  const navigate = useNavigate();
  const { openEdit } = useActivityFormSession();
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

  const editActivity = useCallback(
    (activity: ActivityDTO) => {
      if (!tenantId) return;
      openEdit(activity, { tenantId });
    },
    [openEdit, tenantId]
  );

  const publishActivity = useCallback(
    async (activityId: string) => {
      if (!tenantId) return;
      setBusy(true);
      setError(null);
      try {
        await api.publishOrganisationActivity(tenantId, activityId);
        await afterChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not publish.');
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
        const res = await api.duplicateOrganisationActivity(tenantId, activity.id);
        await afterChange();
        openEdit(res.data, { tenantId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not duplicate.');
      } finally {
        setBusy(false);
      }
    },
    [afterChange, openEdit, tenantId]
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
      await api.cancelOrganisationActivity(tenantId, confirmCancel.id);
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
      await api.cancelOrganisationActivity(tenantId, confirmDelete.id);
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
    editActivity,
    publishActivity,
    duplicateActivity,
    reorganizeActivity,
    createLinkedRideshare,
    previewPublished: openPublishedActivityPreview,
  };
}
