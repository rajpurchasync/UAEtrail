import { useEffect, useState } from 'react';
import { ActivityDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { useActivityFormSession } from '../context/ActivityFormSessionContext';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import {
  activityTypeBadgeClass,
  formatActivityType,
  resolveActivityOwnerLabel,
} from '../utils/activityIdentity';

type Tab = 'active' | 'past';

export const AdminActivities = () => {
  const [events, setEvents] = useState<ActivityDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [tenants, setTenants] = useState<TenantListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ activity: ActivityDTO; action: 'suspend' | 'unsuspend' } | null>(null);
  const [suspendComment, setSuspendComment] = useState('');
  const { openCreate, setOnSaved } = useActivityFormSession();

  useEffect(() => {
    setOnSaved(() => () => void loadEvents());
    return () => setOnSaved(null);
  }, [setOnSaved]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminActivities();
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [locRes, tenRes] = await Promise.all([api.getAdminLocations(), api.getAdminTenants()]);
      setLocations(locRes.data);
      setTenants(tenRes.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => { loadEvents(); loadRefs(); }, []);

  const executeModerate = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.action === 'suspend' && !suspendComment.trim()) {
      setError('A comment is required when suspending an event.');
      return;
    }
    try {
      await api.moderateActivity(
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
      e.locationName.toLowerCase().includes(q) ||
      (e.organizerName ?? e.hostName ?? '').toLowerCase().includes(q) ||
      (e.title ?? '').toLowerCase().includes(q)
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
      await api.toggleActivityFeatured(activityId);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle featured');
    }
  };

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
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-56" />
            <button
              onClick={() =>
                openCreate({
                  hostOrganizations: tenants,
                  venueLocations: locations,
                })
              }
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
                <th className="px-4 py-3 text-left">Activity</th>
                <th className="px-4 py-3 text-left">Activity Type</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Venue</th>
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
                <>
                  <tr key={event.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{event.title || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(event.activityType)}`}
                      >
                        {formatActivityType(event.activityType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{resolveActivityOwnerLabel(event)}</td>
                    <td className="px-4 py-3">{event.locationName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-900">{event.date}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-900">{event.slotsTotal - event.slotsAvailable}</span>
                      <span className="text-gray-400">/{event.slotsTotal}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{event.price > 0 ? `AED ${event.price}` : 'Free'}</td>
                    <td className="px-4 py-3">{statusBadge(event.status)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {/* Featured toggle */}
                        {event.status === 'published' && (
                          <button onClick={() => toggleFeatured(event.id)}
                            title={event.featured ? 'Remove from featured' : 'Feature on landing page'}
                            className={`px-2 py-1 rounded text-xs font-medium ${event.featured ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {event.featured ? '★ Featured' : '☆ Feature'}
                          </button>
                        )}
                        {/* Moderation */}
                        {event.status === 'suspended' ? (
                          <button onClick={() => { setConfirmTarget({ activity: event, action: 'unsuspend' }); setSuspendComment(''); }}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Unsuspend</button>
                        ) : event.status !== 'cancelled' ? (
                          <button onClick={() => { setConfirmTarget({ activity: event, action: 'suspend' }); setSuspendComment(''); }}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs">Suspend</button>
                        ) : null}
                      </div>
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
                            <p className="text-xs text-gray-500 uppercase font-medium">Location ID</p>
                            <p className="text-gray-700 break-all text-xs mt-0.5">{event.locationId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Tenant ID</p>
                            <p className="text-gray-700 break-all text-xs mt-0.5">{event.tenantId}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Showing {filtered.length} of {displayed.length} {tab} events</p>
      </div>

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
