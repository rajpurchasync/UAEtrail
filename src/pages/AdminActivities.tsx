import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityDTO, LocationDTO } from '@uaetrail/shared-types';
import {
  fetchAdminActivityEngagement,
  fetchAdminModerationActivities,
  fetchAdminPlacesCatalog,
  moderateAdminActivity,
  toggleAdminActivityFeatured,
} from '../hooks/adminConsoleApi';
import {
  cancelHostActivityById,
  duplicateHostActivityById,
  publishHostActivityById,
} from '../hooks/hostActivityClientApi';
import { ActivityActionsMenu, ActivityListPreview, buildAdminActivityMenuItems, openPublishedActivityPreview } from '../components/activities';
import { useReloadExploreMap } from '../hooks/useReloadExploreMap';
import { Link } from 'react-router-dom';
import { ADMIN_PLACES_PATH } from '../config/surfacePaths';
import { navigateToExploreOrganize } from '../explore/navigateExploreOrganize';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import {
  activityTypeBadgeClass,
  formatActivityCapacity,
  formatActivityPrice,
  formatActivityType,
  resolveActivityHostLabel,
  resolveActivityLocationState,
  resolveActivityTitle,
} from '../utils/activityIdentity';
import { navigateToReorganizeActivity } from '../explore/navigateReorganizeActivity';

type Tab = 'active' | 'past';

export const AdminActivities = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [engagementByActivityId, setEngagementByActivityId] = useState<
    Record<
      string,
      {
        participants: Array<{
          id: string;
          userId: string;
          checkedInAt: string | null;
          displayName: string | null;
          email: string;
        }>;
        joinRequests: Array<{
          id: string;
          status: string;
          displayName: string | null;
          email: string;
          note: string | null;
        }>;
      }
    >
  >({});
  const [engagementLoadingId, setEngagementLoadingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ activity: ActivityDTO; action: 'suspend' | 'unsuspend' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityDTO | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ActivityDTO | null>(null);
  const [previewActivity, setPreviewActivity] = useState<ActivityDTO | null>(null);
  const [previewPublishing, setPreviewPublishing] = useState(false);
  const [suspendComment, setSuspendComment] = useState('');
  const reloadExploreMap = useReloadExploreMap();

  const loadEvents = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminModerationActivities();
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const places = await fetchAdminPlacesCatalog();
      setLocations(places);
    } catch { /* non-critical */ }
  };

  useEffect(() => { loadEvents(); loadRefs(); }, []);

  const loadEngagement = async (activityId: string) => {
    if (engagementByActivityId[activityId]) return;
    setEngagementLoadingId(activityId);
    try {
      const engagement = await fetchAdminActivityEngagement(activityId);
      setEngagementByActivityId((prev) => ({ ...prev, [activityId]: engagement }));
    } catch {
      setEngagementByActivityId((prev) => ({
        ...prev,
        [activityId]: { participants: [], joinRequests: [] },
      }));
    } finally {
      setEngagementLoadingId(null);
    }
  };

  const toggleExpanded = (activityId: string) => {
    const next = expandedId === activityId ? null : activityId;
    setExpandedId(next);
    if (next) void loadEngagement(next);
  };

  const executeModerate = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.action === 'suspend' && !suspendComment.trim()) {
      setError('A comment is required when suspending an event.');
      return;
    }
    try {
      await moderateAdminActivity(
        confirmTarget.activity.id,
        confirmTarget.action,
        confirmTarget.action === 'suspend' ? suspendComment.trim() : undefined
      );
      setConfirmTarget(null);
      setSuspendComment('');
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  const now = new Date().toISOString().slice(0, 10);
  const sortByLatestDate = (a: ActivityDTO, b: ActivityDTO) =>
    b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
  const activeEvents = events.filter((e) => e.date >= now && e.status !== 'cancelled').sort(sortByLatestDate);
  const pastEvents = events.filter((e) => e.date < now || e.status === 'cancelled').sort(sortByLatestDate);
  const displayed = tab === 'active' ? activeEvents : pastEvents;

  const filtered = displayed.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.title ?? '').toLowerCase().includes(q) ||
      e.locationName.toLowerCase().includes(q) ||
      (e.region ?? '').toLowerCase().includes(q) ||
      (e.tenantName ?? '').toLowerCase().includes(q) ||
      (e.hostName ?? '').toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const toggleFeatured = async (activityId: string) => {
    try {
      await toggleAdminActivityFeatured(activityId);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle featured');
    }
  };

  const publish = async (event: ActivityDTO) => {
    if (!event.tenantId) return;
    try {
      await publishHostActivityById(event.tenantId, event.id);
      await reloadExploreMap();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish activity');
    }
  };

  const duplicateActivity = async (event: ActivityDTO) => {
    if (!event.tenantId) return;
    try {
      const duplicate = await duplicateHostActivityById(event.tenantId, event.id);
      await loadEvents();
      navigateToReorganizeActivity(navigate, duplicate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate activity');
    }
  };

  const reorganizeActivity = (event: ActivityDTO) => {
    navigateToReorganizeActivity(navigate, event);
  };

  const deleteDraft = async () => {
    if (!confirmDelete?.tenantId) return;
    try {
      await cancelHostActivityById(confirmDelete.tenantId, confirmDelete.id);
      setConfirmDelete(null);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
      setConfirmDelete(null);
    }
  };

  const cancelActivity = async () => {
    if (!confirmCancel?.tenantId) return;
    try {
      await cancelHostActivityById(confirmCancel.tenantId, confirmCancel.id);
      setConfirmCancel(null);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel activity');
      setConfirmCancel(null);
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
    if (!event.tenantId) return;
    setPreviewPublishing(true);
    try {
      await publishHostActivityById(event.tenantId, event.id);
      await reloadExploreMap();
      setPreviewActivity(null);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish activity');
    } finally {
      setPreviewPublishing(false);
    }
  };

  const previewVenue = previewActivity
    ? locations.find((location) => location.id === previewActivity.locationId)
    : undefined;

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        {/* Header + Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setTab('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              Active Activities ({activeEvents.length})
            </button>
            <button onClick={() => setTab('past')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'past' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              Past Activities ({pastEvents.length})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-56" />
            <Link
              to={ADMIN_PLACES_PATH}
              className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Add place / venue
            </Link>
            <button
              onClick={() => navigateToExploreOrganize(navigate)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              + Add Activity
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

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
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  {tab === 'active' ? 'No active events' : 'No past events'}
                </td></tr>
              ) : filtered.map((event) => (
                <Fragment key={event.id}>
                  <tr
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (event.status === 'draft') {
                        reorganizeActivity(event);
                        return;
                      }
                      toggleExpanded(event.id);
                    }}
                  >
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <ActivityActionsMenu
                        items={buildAdminActivityMenuItems(event, {
                          onPreview: openPreview,
                          onPublish: publish,
                          onDuplicate: duplicateActivity,
                          onReorganize: reorganizeActivity,
                          onDelete: setConfirmDelete,
                          onCancel: setConfirmCancel,
                          onFeature: () => toggleFeatured(event.id),
                          onSuspend: () => {
                            setConfirmTarget({ activity: event, action: 'suspend' });
                            setSuspendComment('');
                          },
                          onUnsuspend: () => {
                            setConfirmTarget({ activity: event, action: 'unsuspend' });
                            setSuspendComment('');
                          },
                        })}
                      />
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <tr key={`${event.id}-detail`} className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {event.description && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 uppercase font-medium">Description</p>
                              <p className="text-gray-700 text-sm mt-0.5">{event.description}</p>
                            </div>
                          )}
                          {event.locationName && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">Venue</p>
                              <p className="text-gray-700 text-xs mt-0.5">{event.locationName}</p>
                            </div>
                          )}
                          {event.meetingPoint && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">Meeting Point</p>
                              <p className="text-gray-700 text-xs mt-0.5">{event.meetingPoint}</p>
                            </div>
                          )}
                          {event.requirements && event.requirements.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">Requirements</p>
                              <ul className="text-xs text-gray-700 list-disc list-inside mt-0.5">
                                {event.requirements.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          )}
                          {event.itinerary && event.itinerary.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 uppercase font-medium">Itinerary</p>
                              <ol className="text-xs text-gray-700 list-decimal list-inside mt-0.5">
                                {event.itinerary.map((item, i) => <li key={i}>{item}</li>)}
                              </ol>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Place ID</p>
                            <p className="text-gray-700 break-all text-xs mt-0.5">{event.locationId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Tenant ID</p>
                            <p className="text-gray-700 break-all text-xs mt-0.5">{event.tenantId}</p>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Participation
                          </p>
                          {engagementLoadingId === event.id ? (
                            <p className="mt-2 text-xs text-gray-500">Loading roster…</p>
                          ) : (
                            <div className="mt-2 grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-gray-700">
                                  Joined ({engagementByActivityId[event.id]?.participants.length ?? 0})
                                </p>
                                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
                                  {(engagementByActivityId[event.id]?.participants ?? []).map((p) => (
                                    <li key={p.id}>
                                      {p.displayName || p.email}
                                      {p.checkedInAt ? (
                                        <span className="ml-1 text-emerald-700">· checked in</span>
                                      ) : null}
                                    </li>
                                  ))}
                                  {(engagementByActivityId[event.id]?.participants.length ?? 0) === 0 && (
                                    <li className="text-gray-400">No participants yet</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">
                                  Join requests ({engagementByActivityId[event.id]?.joinRequests.length ?? 0})
                                </p>
                                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
                                  {(engagementByActivityId[event.id]?.joinRequests ?? []).map((r) => (
                                    <li key={r.id}>
                                      {r.displayName || r.email}
                                      <span className="ml-1 text-gray-500">· {r.status}</span>
                                    </li>
                                  ))}
                                  {(engagementByActivityId[event.id]?.joinRequests.length ?? 0) === 0 && (
                                    <li className="text-gray-400">No requests</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Showing {filtered.length} of {displayed.length} {tab} events</p>
      </div>

      <ActivityListPreview
        activity={previewActivity}
        venue={previewVenue}
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

      {/* Cancel Activity Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmCancel(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Activity?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will cancel the activity and notify all registered participants. This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmCancel.title || confirmCancel.locationName}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmCancel(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Keep Activity</button>
              <button onClick={cancelActivity} className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Cancel Activity</button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.action === 'suspend' ? 'Suspend Activity?' : 'Unsuspend Activity?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.action === 'suspend'
                ? 'This will hide the event from public listings and prevent new bookings.'
                : 'This will restore the event and make it visible to the public again.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.activity.title || confirmTarget.activity.locationName}</p>
            {confirmTarget.action === 'suspend' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for suspension *</label>
                <textarea
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  placeholder="Explain why this event is being suspended..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeModerate}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmTarget.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmTarget.action === 'suspend' ? 'Suspend' : 'Unsuspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
