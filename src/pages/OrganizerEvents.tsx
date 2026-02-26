import { useEffect, useState } from 'react';
import { EventDTO, LocationDTO, ParticipantDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

const emptyForm = {
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  capacity: 10,
  price: 0,
  meetingPoint: '',
  itinerary: '',
  requirements: ''
};

type ViewMode = 'list' | 'checkin';

export const OrganizerEvents = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check-in state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [checkinEventId, setCheckinEventId] = useState<string | null>(null);
  const [checkinEventTitle, setCheckinEventTitle] = useState('');
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const loadEvents = async (tid: string) => {
    if (!tid) return;
    try {
      const res = await api.getOrganizerEvents(tid);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  const loadLocations = async () => {
    try {
      const res = await api.getPublicLocations();
      setLocations(res.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    loadEvents(tenantId);
    loadLocations();
  }, [tenantId]);

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { setError('Select organization first'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        itinerary: form.itinerary ? form.itinerary.split('\n').filter(Boolean) : [],
        requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : [],
        meetingPoint: form.meetingPoint || undefined
      };
      await api.createOrganizerEvent(tenantId, payload);
      closeModal();
      setForm(emptyForm);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const publish = async (eventId: string) => {
    if (!tenantId) return;
    try {
      await api.publishOrganizerEvent(tenantId, eventId);
      await loadEvents(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event');
    }
  };

  // Check-in functions
  const openCheckin = async (event: EventDTO) => {
    if (!tenantId) return;
    setCheckinEventId(event.id);
    setCheckinEventTitle(event.locationName);
    setCheckinLoading(true);
    setViewMode('checkin');
    try {
      const res = await api.getEventParticipants(tenantId, event.id);
      setParticipants(res.data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
      setParticipants([]);
    } finally {
      setCheckinLoading(false);
    }
  };

  const toggleCheckin = async (participant: ParticipantDTO) => {
    if (!tenantId || !checkinEventId) return;
    try {
      if (participant.checkedInAt) {
        await api.undoCheckin(tenantId, checkinEventId, participant.id);
      } else {
        await api.checkinParticipant(tenantId, checkinEventId, participant.id);
      }
      // Refresh participants
      const res = await api.getEventParticipants(tenantId, checkinEventId);
      setParticipants(res.data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update check-in');
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

  const checkedInCount = participants.filter((p) => p.checkedInAt).length;

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}

        {viewMode === 'list' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Events</h2>
              <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium" disabled={!tenantId}>
                + Create Event
              </button>
            </div>

            {/* Events Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Capacity</th>
                    <th className="px-4 py-3 text-center">Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{event.locationName}</p>
                        <p className="text-xs text-gray-500 capitalize">{event.activityType}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p>{event.date}</p>
                        <p className="text-xs text-gray-500">{event.time}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span>{event.slotsTotal - event.slotsAvailable}</span>
                        <span className="text-gray-400">/{event.slotsTotal}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{event.price > 0 ? `AED ${event.price}` : 'Free'}</td>
                      <td className="px-4 py-3">{statusBadge(event.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {event.status === 'draft' && (
                            <button onClick={() => publish(event.id)}
                              className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Publish</button>
                          )}
                          {event.status === 'published' && (
                            <button onClick={() => openCheckin(event)}
                              className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Check-in</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No events yet. Create your first event!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Check-in View */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewMode('list')} className="text-sm text-gray-600 hover:text-gray-900">← Back to Events</button>
              <h2 className="text-lg font-semibold text-gray-900">Check-in: {checkinEventTitle}</h2>
            </div>

            {/* Progress */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Check-in Progress</p>
                <p className="text-sm text-gray-600">{checkedInCount} / {participants.length} checked in</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${participants.length > 0 ? (checkedInCount / participants.length * 100) : 0}%` }} />
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white border rounded-lg overflow-hidden">
              {checkinLoading ? (
                <p className="px-4 py-8 text-center text-gray-500">Loading participants...</p>
              ) : participants.length === 0 ? (
                <p className="px-4 py-8 text-center text-gray-500">No participants for this event</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Participant</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id} className={`border-t ${p.checkedInAt ? 'bg-green-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                {p.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{p.displayName}</p>
                              {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.joinedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          {p.checkedInAt ? (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">Checked In</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">Not Yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleCheckin(p)}
                            className={`px-3 py-1 rounded text-xs font-medium ${p.checkedInAt ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {p.checkedInAt ? 'Undo' : 'Check In'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create New Event</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location *</label>
                  <select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.region} - {loc.activityType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Weekend Jebel Jais Hike" />
                </div>
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
                  placeholder="6:00 AM - Meet at parking\n6:30 AM - Start hike\n10:00 AM - Summit" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Requirements (one per line)</label>
                <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                  placeholder="Hiking boots required\nBring 2L water minimum\nModerate fitness level" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
