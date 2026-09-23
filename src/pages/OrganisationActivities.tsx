import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { parseActivityTypeParam, ActivityActionsMenu, ActivityListPreview, buildHostActivityMenuItems, openPublishedActivityPreview } from '../components/activities';
import { useActivityFormSession } from '../context/ActivityFormSessionContext';
import { useReloadExploreMap } from '../hooks/useReloadExploreMap';
import { OrganisationConsoleShell } from '../components/organisation-console/OrganisationConsoleShell';
import { OrganisationActivityCheckInPanel } from '../components/organisation-console/OrganisationActivityCheckInPanel';
import { TenantSwitcher, ShareButton } from '../components/ui';
import {
  activityTypeBadgeClass,
  formatActivityCapacity,
  formatActivityPrice,
  formatActivityType,
  resolveActivityHostLabel,
  resolveActivityLocationState,
  resolveActivityTitle,
} from '../utils/activityIdentity';

type ViewMode = 'list' | 'checkin';

export const OrganisationActivities = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { openCreate, openEdit, setOnSaved } = useActivityFormSession();
  const reloadExploreMap = useReloadExploreMap();
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityDTO | null>(null);
  const [previewActivity, setPreviewActivity] = useState<ActivityDTO | null>(null);
  const [previewPublishing, setPreviewPublishing] = useState(false);

  // Check-in state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [checkinActivityId, setCheckinActivityId] = useState<string | null>(null);
  const [checkinActivityTitle, setCheckinActivityTitle] = useState('');

  const loadEvents = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.listOrganisationActivities(tid);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  useEffect(() => {
    loadEvents(tenantId);
  }, [tenantId]);

  const openCreateActivity = () => {
    openCreate({ tenantId });
  };

  useEffect(() => {
    setOnSaved(() => () => void loadEvents(tenantId));
    return () => setOnSaved(null);
  }, [tenantId, setOnSaved]);

  useEffect(() => {
    if (location.pathname === '/host/activities/new') {
      openCreate({
        tenantId,
        initialActivityType: parseActivityTypeParam(searchParams.get('type')),
      });
    }
  }, [location.pathname, searchParams, tenantId, openCreate]);

  const openEditActivity = (event: ActivityDTO) => {
    openEdit(event, { tenantId });
  };

  const publish = async (activityId: string) => {
    if (!tenantId) return;
    try {
      await api.publishHostActivity(tenantId, activityId);
      await reloadExploreMap();
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event');
    }
  };

  const cancelEvent = async () => {
    if (!tenantId || !confirmCancel) return;
    try {
      await api.cancelOrganisationActivity(tenantId, confirmCancel.id);
      setConfirmCancel(null);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
      setConfirmCancel(null);
    }
  };

  const deleteDraft = async () => {
    if (!tenantId || !confirmDelete) return;
    try {
      await api.cancelOrganisationActivity(tenantId, confirmDelete.id);
      setConfirmDelete(null);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
      setConfirmDelete(null);
    }
  };

  const duplicateActivity = async (event: ActivityDTO) => {
    if (!tenantId) return;
    try {
      const res = await api.duplicateOrganisationActivity(tenantId, event.id);
      await loadEvents(tenantId);
      openEdit(res.data, { tenantId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate activity');
    }
  };

  const openPreview = (event: ActivityDTO) => {
    if (event.status === 'published') {
      openPublishedActivityPreview(event.id);
      return;
    }
    setPreviewActivity(event);
  };

  const publishFromPreview = async (event: ActivityDTO) => {
    if (!tenantId) return;
    setPreviewPublishing(true);
    try {
      await api.publishHostActivity(tenantId, event.id);
      await reloadExploreMap();
      setPreviewActivity(null);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setPreviewPublishing(false);
    }
  };

  const openCheckin = (event: ActivityDTO) => {
    setCheckinActivityId(event.id);
    setCheckinActivityTitle(event.title || event.locationName);
    setViewMode('checkin');
  };

  useEffect(() => {
    const checkinId = searchParams.get('checkin');
    if (!checkinId || !tenantId || events.length === 0) return;

    const event = events.find((item) => item.id === checkinId);
    if (!event || event.status !== 'published') return;

    openCheckin(event);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('checkin');
    setSearchParams(nextParams, { replace: true });
  }, [events, searchParams, setSearchParams, tenantId]);

  const closeCheckin = () => {
    setViewMode('list');
    setCheckinActivityId(null);
    setCheckinActivityTitle('');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <OrganisationConsoleShell title="Activities">
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}

        {viewMode === 'list' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
              <button onClick={openCreateActivity} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium" disabled={!tenantId}>
                + Add Activity
              </button>
            </div>

            {/* Events Table */}
            <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Host</th>
                    <th className="px-4 py-3 text-left">Place</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Capacity</th>
                    <th className="px-4 py-3 text-center">Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{resolveActivityTitle(event)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(event.activityType)}`}
                        >
                          {formatActivityType(event.activityType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{resolveActivityHostLabel(event)}</td>
                      <td className="px-4 py-3">{resolveActivityLocationState(event)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-gray-900">{event.date}</p>
                        <p className="text-xs text-gray-500">{event.time}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">{formatActivityCapacity(event)}</td>
                      <td className="px-4 py-3 text-center">{formatActivityPrice(event)}</td>
                      <td className="px-4 py-3">{statusBadge(event.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {event.status === 'published' && (
                            <ShareButton
                              title={event.title || event.locationName}
                              text={`${event.date} · ${event.activityType} activity on UAE Trails`}
                              path={`/activity/${event.id}`}
                              iconOnly
                              light
                            />
                          )}
                          <ActivityActionsMenu
                            items={buildHostActivityMenuItems(event, {
                              onPreview: openPreview,
                              onEdit: openEditActivity,
                              onPublish: (e) => publish(e.id),
                              onDuplicate: duplicateActivity,
                              onDelete: setConfirmDelete,
                              onCancel: setConfirmCancel,
                              onCheckin: openCheckin,
                            })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No activities yet. Create your first activity!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : checkinActivityId && tenantId ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={closeCheckin}
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
            >
              ← Back to activities
            </button>
            <OrganisationActivityCheckInPanel
              tenantId={tenantId}
              activityId={checkinActivityId}
              activityTitle={checkinActivityTitle}
              onError={setError}
            />
          </div>
        ) : null}
      </div>

      <ActivityListPreview
        activity={previewActivity}
        saving={previewPublishing}
        onClose={() => setPreviewActivity(null)}
        onSaveDraft={() => setPreviewActivity(null)}
        onPublish={publishFromPreview}
      />

      {/* Delete Draft Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Draft?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will permanently delete this draft. This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmDelete.title || confirmDelete.locationName}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Keep Draft</button>
              <button onClick={deleteDraft} className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Event Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmCancel(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Event?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will cancel the event and notify all registered participants. This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmCancel.title || confirmCancel.locationName}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmCancel(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Keep Event</button>
              <button onClick={cancelEvent} className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Cancel Event</button>
            </div>
          </div>
        </div>
      )}
    </OrganisationConsoleShell>
  );
};
