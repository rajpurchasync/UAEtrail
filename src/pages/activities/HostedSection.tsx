import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import {
  ActivityActionsMenu,
  buildHostActivityMenuItems,
  openPublishedActivityPreview,
} from '../../components/activities';
import { HostJoinRequestCard } from '../../components/host/HostJoinRequestCard';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { useHostHubData } from '../../hooks/useHostHubData';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { AppButton } from '../../components/mobile/AppButton';
import { Dialog } from '../../components/ui/Dialog';
import { formatActivityType } from '../../utils/activityIdentity';

type ActivityTab = 'upcoming' | 'past';

const statusStyle: Record<string, string> = {
  draft: 'bg-neutral-500/10 text-neutral-600',
  published: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-red-500/15 text-red-600',
  suspended: 'bg-orange-500/15 text-orange-700',
};

const formatEventMeta = (event: ActivityDTO) => {
  const parts = [formatActivityType(event.activityType), event.date];
  if (event.time) parts.push(event.time);
  if (event.locationName) parts.push(event.locationName);
  return parts.filter(Boolean).join(' · ');
};

export const HostedSection = () => {
  const navigate = useNavigate();
  const host = useHostHubData();
  const { openEdit } = useActivityFormSession();
  const [activityTab, setActivityTab] = useState<ActivityTab>('upcoming');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: 'delete' | 'cancel'; activity: ActivityDTO } | null
  >(null);

  const today = useMemo(() => new Date(new Date().toDateString()), []);

  const upcomingActivities = useMemo(
    () =>
      host.activities
        .filter((event) => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [host.activities, today]
  );

  const pastActivities = useMemo(
    () =>
      host.activities
        .filter((event) => new Date(event.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [host.activities, today]
  );

  const visibleActivities = activityTab === 'upcoming' ? upcomingActivities : pastActivities;

  const decideRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!host.tenantId) return;
    setError(null);
    setBusyRequestId(requestId);
    try {
      await api.decideHostRequest(host.tenantId, requestId, status);
      await host.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const duplicateActivity = async (event: ActivityDTO) => {
    if (!host.tenantId) return;
    setError(null);
    setBusyActivityId(event.id);
    try {
      const res = await api.duplicateHostActivity(host.tenantId, event.id);
      await host.reload();
      openEdit(res.data, { tenantId: host.tenantId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate activity');
    } finally {
      setBusyActivityId(null);
    }
  };

  const publishActivity = async (event: ActivityDTO) => {
    if (!host.tenantId) return;
    setError(null);
    setBusyActivityId(event.id);
    try {
      await api.publishHostActivity(host.tenantId, event.id);
      await host.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish activity');
    } finally {
      setBusyActivityId(null);
    }
  };

  const runConfirmAction = async () => {
    if (!host.tenantId || !confirmAction) return;
    setError(null);
    setBusyActivityId(confirmAction.activity.id);
    try {
      await api.cancelHostActivity(host.tenantId, confirmAction.activity.id);
      setConfirmAction(null);
      await host.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
    } finally {
      setBusyActivityId(null);
    }
  };

  const openActivity = (event: ActivityDTO) => {
    if (event.status === 'draft') {
      openEdit(event, { tenantId: host.tenantId! });
      return;
    }
    if (event.status === 'published') {
      openPublishedActivityPreview(event.id);
      return;
    }
    navigate(`/activity/${event.id}`);
  };

  if (host.loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!host.tenantId) {
    return (
      <GlassCard padding>
        <p className="text-sm text-neutral-600">Select a host organization to manage your activities.</p>
        <Link to="/host/overview" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
          Open host dashboard
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <GlassCard padding className="border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      {host.pendingRequests.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-neutral-800">
              Incoming requests ({host.pendingRequests.length})
            </h3>
            <Link to="/host/requests" className="text-xs font-semibold text-emerald-600">
              View all
            </Link>
          </div>
          {host.pendingRequests.slice(0, 3).map((request) => (
            <HostJoinRequestCard
              key={request.id}
              request={request}
              busy={busyRequestId === request.id}
              onApprove={() => void decideRequest(request.id, 'approved')}
              onReject={() => void decideRequest(request.id, 'rejected')}
            />
          ))}
        </section>
      )}

      <div className="flex items-center justify-between gap-2">
        <AppSegmented
          segments={[
            { key: 'upcoming', label: `Upcoming (${upcomingActivities.length})` },
            { key: 'past', label: `Past (${pastActivities.length})` },
          ]}
          value={activityTab}
          onChange={setActivityTab}
        />
        <Link
          to="/host/activities/new"
          className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          + New
        </Link>
      </div>

      {visibleActivities.length === 0 ? (
        <GlassCard padding>
          <p className="text-sm text-neutral-600">
            {activityTab === 'upcoming' ? 'No upcoming hosted activities.' : 'No past hosted activities yet.'}
          </p>
          <Link to="/host/activities/new" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
            Create activity
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {visibleActivities.map((event) => (
            <div key={event.id} className="glass-card-interactive flex items-center gap-1 p-1 pl-3.5">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  className="w-full text-left py-2"
                  onClick={() => openActivity(event)}
                >
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {event.title || event.locationName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{formatEventMeta(event)}</p>
                </button>
              </div>
              <span
                className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  statusStyle[event.status] ?? statusStyle.draft
                }`}
              >
                {event.status}
              </span>
              <ActivityActionsMenu
                items={buildHostActivityMenuItems(event, {
                  onPreview: (activity) => {
                    if (activity.status === 'published') openPublishedActivityPreview(activity.id);
                  },
                  onEdit: (activity) => openEdit(activity, { tenantId: host.tenantId! }),
                  onPublish: publishActivity,
                  onDuplicate: duplicateActivity,
                  onDelete: (activity) => setConfirmAction({ type: 'delete', activity }),
                  onCancel: (activity) => setConfirmAction({ type: 'cancel', activity }),
                })}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'delete' ? 'Delete draft?' : 'Cancel activity?'}
      >
        <p className="text-sm text-neutral-600 mb-4">
          {confirmAction?.type === 'delete'
            ? `Remove "${confirmAction.activity.title || confirmAction.activity.locationName}" permanently?`
            : `Cancel "${confirmAction?.activity.title || confirmAction?.activity.locationName}"? Participants will be notified.`}
        </p>
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" onClick={() => setConfirmAction(null)}>
            Keep
          </AppButton>
          <AppButton
            type="button"
            variant="destructive"
            disabled={Boolean(busyActivityId)}
            onClick={() => void runConfirmAction()}
          >
            {confirmAction?.type === 'delete' ? 'Delete' : 'Cancel activity'}
          </AppButton>
        </div>
      </Dialog>
    </div>
  );
};
