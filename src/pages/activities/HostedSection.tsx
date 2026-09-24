import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import {
  ActivityActionsMenu,
  buildOrganisationActivityMenuItems,
  openPublishedActivityPreview,
} from '../../components/activities';
import { OrganisationJoinRequestCard } from '../../components/organisation-console/OrganisationJoinRequestCard';
import { OrganisationActivityCheckInPanel } from '../../components/organisation-console/OrganisationActivityCheckInPanel';
import { useActivityFormSession } from '../../context/ActivityFormSessionContext';
import { useOrganisationHubData } from '../../hooks/useOrganisationHubData';
import { useReloadExploreMap } from '../../hooks/useReloadExploreMap';
import { exploreOrganizePath } from '../../utils/exploreRouting';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { AppButton } from '../../components/mobile/AppButton';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { Dialog } from '../../components/ui/Dialog';
import { formatActivityType } from '../../utils/activityIdentity';
import { matchesActivitySearch } from '../../utils/activitySearch';

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

export const HostedSection = ({
  refreshKey = 0,
  searchQuery = '',
}: {
  refreshKey?: number;
  searchQuery?: string;
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const host = useOrganisationHubData();
  const reloadExploreMap = useReloadExploreMap();
  const { openEdit } = useActivityFormSession();
  const [activityTab, setActivityTab] = useState<ActivityTab>('upcoming');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [busyActivityId, setBusyActivityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: 'delete' | 'cancel'; activity: ActivityDTO } | null
  >(null);
  const [checkinActivity, setCheckinActivity] = useState<ActivityDTO | null>(null);

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

  const filteredActivities = useMemo(
    () =>
      visibleActivities.filter((event) =>
        matchesActivitySearch(searchQuery, event.title, event.locationName)
      ),
    [searchQuery, visibleActivities]
  );

  useEffect(() => {
    if (!refreshKey) return;
    void host.reload();
  }, [refreshKey, host.reload]);

  useEffect(() => {
    const checkinId = searchParams.get('checkin');
    if (!checkinId || host.loading || !host.tenantId) return;

    const activity = host.activities.find((event) => event.id === checkinId);
    if (!activity || activity.status !== 'published') return;

    setCheckinActivity(activity);
    const next = new URLSearchParams(searchParams);
    next.delete('checkin');
    setSearchParams(next, { replace: true });
  }, [host.activities, host.loading, host.tenantId, searchParams, setSearchParams]);

  const decideRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!host.tenantId) return;
    setError(null);
    setBusyRequestId(requestId);
    try {
      await api.decideOrganisationJoinRequest(host.tenantId, requestId, status);
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
      const res = await api.duplicateOrganisationActivity(host.tenantId, event.id);
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
      await api.publishOrganisationActivity(host.tenantId, event.id);
      await reloadExploreMap();
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
      await api.cancelOrganisationActivity(host.tenantId, confirmAction.activity.id);
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
    return <ConsumerLoadingSpinner />;
  }

  if (!host.tenantId) {
    return (
      <GlassCard padding>
        <p className="text-sm text-neutral-600">Select a host to manage your activities.</p>
        <Link to="/host/overview" className="mt-2 inline-block text-sm font-semibold text-emerald-700">
          Open host console
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ConsumerErrorCard message={error} />}

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
            <OrganisationJoinRequestCard
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
          to={exploreOrganizePath()}
          className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          + New
        </Link>
      </div>

      {visibleActivities.length === 0 ? (
        <ConsumerInlineEmpty
          message={
            activityTab === 'upcoming' ? 'No upcoming hosted activities.' : 'No past hosted activities yet.'
          }
          actionLabel="Create activity"
          actionTo={exploreOrganizePath()}
        />
      ) : filteredActivities.length === 0 ? (
        <ConsumerInlineEmpty message="No hosted activities match your search." />
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((event) => (
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
                items={buildOrganisationActivityMenuItems(event, {
                  onPreview: (activity) => {
                    if (activity.status === 'published') openPublishedActivityPreview(activity.id);
                  },
                  onEdit: (activity) => openEdit(activity, { tenantId: host.tenantId! }),
                  onPublish: publishActivity,
                  onDuplicate: duplicateActivity,
                  onDelete: (activity) => setConfirmAction({ type: 'delete', activity }),
                  onCancel: (activity) => setConfirmAction({ type: 'cancel', activity }),
                  onCheckin: (activity) => setCheckinActivity(activity),
                })}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(checkinActivity)}
        onClose={() => setCheckinActivity(null)}
        title="Check in attendees"
      >
        {checkinActivity && host.tenantId ? (
          <OrganisationActivityCheckInPanel
            tenantId={host.tenantId}
            activityId={checkinActivity.id}
            activityTitle={checkinActivity.title || checkinActivity.locationName}
            onError={setError}
          />
        ) : null}
      </Dialog>

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
