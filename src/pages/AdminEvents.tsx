import { useEffect, useMemo, useState } from 'react';
import { EventDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../config/activityTypes';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ImageUpload, ActivityTypeSelect, LocationSelect } from '../components/ui';
import { ADMIN_LINKS } from '../constants';

type Tab = 'active' | 'past';

const emptyForm = {
  activityType: 'hiking' as ActivityType,
  tenantId: '',
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  capacity: 10,
  price: 0,
  meetingPoint: '',
  itinerary: '',
  requirements: '',
  images: [] as string[]
};

export const AdminEvents = () => {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [tenants, setTenants] = useState<TenantListDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ event: EventDTO; action: 'suspend' | 'unsuspend' } | null>(null);
  const [suspendComment, setSuspendComment] = useState('');

  // Create event state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
      await api.moderateEvent(
        confirmTarget.event.id,
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
  const activeEvents = events.filter((e) => e.date >= now && e.status !== 'cancelled');
  const pastEvents = events.filter((e) => e.date < now || e.status === 'cancelled');
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

  const filteredLocations = useMemo(
    () => locations.filter((loc) => loc.activityType === form.activityType),
    [locations, form.activityType]
  );

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createAdminEvent({
        ...form,
        itinerary: form.itinerary ? form.itinerary.split('\n').filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
        meetingPoint: form.meetingPoint || undefined,
        images: form.images
      });
      setModalOpen(false);
      setForm(emptyForm);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
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

  const toggleFeatured = async (eventId: string) => {
    try {
      await api.toggleEventFeatured(eventId);
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
              Active Events ({activeEvents.length})
            </button>
            <button onClick={() => setTab('past')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'past' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              Past Events ({pastEvents.length})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-56" />
            <button onClick={() => { setForm(emptyForm); setModalOpen(true); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              + Add Event
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Events Table */}
        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
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
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {tab === 'active' ? 'No active events' : 'No past events'}
                </td></tr>
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
                    <td className="px-4 py-3">{event.hostName ?? event.organizerName ?? '—'}</td>
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
                          <button onClick={() => { setConfirmTarget({ event, action: 'unsuspend' }); setSuspendComment(''); }}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Unsuspend</button>
                        ) : event.status !== 'cancelled' ? (
                          <button onClick={() => { setConfirmTarget({ event, action: 'suspend' }); setSuspendComment(''); }}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs">Suspend</button>
                        ) : null}
                      </div>
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
        <p className="text-xs text-gray-500">Showing {filtered.length} of {displayed.length} {tab} events</p>
      </div>

      {/* Add Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Add Event</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <ActivityTypeSelect
                value={form.activityType}
                onChange={(activityType) =>
                  setForm((prev) => ({
                    ...prev,
                    activityType,
                    locationId: prev.activityType === activityType ? prev.locationId : '',
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Organizer *</label>
                  <select required value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select organizer...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location *</label>
                  <LocationSelect
                    value={form.locationId}
                    onChange={(locationId) => setForm({ ...form, locationId })}
                    activityType={form.activityType}
                    locations={filteredLocations}
                    allowAddNew={false}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Weekend Jebel Jais Hike" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Time *</label>
                  <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity *</label>
                  <input type="number" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price (AED)</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0 for free" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe the event, what to expect..." />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting Point</label>
                <input type="text" value={form.meetingPoint} onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. RAK Gateway parking lot" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Itinerary (one step per line)</label>
                <textarea value={form.itinerary} onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                  placeholder="6:00 AM - Meet at parking&#10;6:30 AM - Start hike&#10;10:00 AM - Summit" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Requirements (one per line)</label>
                <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                  placeholder="Hiking boots required&#10;Bring 2L water minimum&#10;Moderate fitness level" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Event Images</label>
                <ImageUpload
                  images={form.images}
                  onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
                  max={6}
                  keyPrefix="events"
                  kind="event-image"
                  preset="event"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Confirmation Modal */}
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
