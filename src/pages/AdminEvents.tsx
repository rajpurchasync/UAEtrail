import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

export const AdminEvents = () => {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ event: EventDTO; action: 'suspend' | 'unsuspend' } | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminEvents();
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const executeModerate = async () => {
    if (!confirmTarget) return;
    try {
      await api.moderateEvent(confirmTarget.event.id, confirmTarget.action);
      setConfirmTarget(null);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  const filtered = events.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (typeFilter !== 'all' && e.activityType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.locationName.toLowerCase().includes(q) && !e.organizerName.toLowerCase().includes(q) && !(e.title ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
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

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <h2 className="text-lg font-semibold text-gray-900 mr-auto">Event Moderation</h2>
          <input type="text" placeholder="Search title, location, organizer..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-60" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="all">All Types</option>
            <option value="hiking">Hiking</option>
            <option value="camping">Camping</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Organizer</th>
                <th className="px-4 py-3 text-center">Capacity</th>
                <th className="px-4 py-3 text-center">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No events found</td></tr>
              ) : filtered.map((event) => (
                <>
                  <tr key={event.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{event.title || event.locationName}</p>
                      <p className="text-xs text-gray-500">{event.locationName} &middot; <span className="capitalize">{event.activityType}</span></p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-900">{event.date}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </td>
                    <td className="px-4 py-3">{event.organizerName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-900">{event.slotsTotal - event.slotsAvailable}</span>
                      <span className="text-gray-400">/{event.slotsTotal}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{event.price > 0 ? `AED ${event.price}` : 'Free'}</td>
                    <td className="px-4 py-3">{statusBadge(event.status)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {event.status === 'suspended' ? (
                        <button onClick={() => setConfirmTarget({ event, action: 'unsuspend' })}
                          className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Unsuspend</button>
                      ) : event.status !== 'cancelled' ? (
                        <button onClick={() => setConfirmTarget({ event, action: 'suspend' })}
                          className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs">Suspend</button>
                      ) : null}
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <tr key={`${event.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
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
        <p className="text-xs text-gray-500">Showing {filtered.length} of {events.length} events. Click a row to expand details.</p>
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.action === 'suspend' ? 'Suspend Event?' : 'Unsuspend Event?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.action === 'suspend'
                ? 'This will hide the event from public listings and prevent new bookings.'
                : 'This will restore the event and make it visible to the public again.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.event.title || confirmTarget.event.locationName}</p>
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
