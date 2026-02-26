import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { DashboardLayout } from '../components/layout';
import { TenantSwitcher } from '../components/ui';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerEvents = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    locationId: '',
    title: '',
    description: '',
    date: '',
    time: '',
    capacity: 10,
    price: 0
  });

  const loadEvents = async (targetTenantId: string) => {
    if (!targetTenantId) return;
    try {
      const response = await api.getOrganizerEvents(targetTenantId);
      setEvents(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load events.');
    }
  };

  useEffect(() => {
    loadEvents(tenantId);
  }, [tenantId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('Set tenant ID first.');
      return;
    }
    setError(null);
    try {
      await api.createOrganizerEvent(tenantId, form);
      setForm({
        locationId: '',
        title: '',
        description: '',
        date: '',
        time: '',
        capacity: 10,
        price: 0
      });
      await loadEvents(tenantId);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create event.');
    }
  };

  const publish = async (eventId: string) => {
    if (!tenantId) return;
    try {
      await api.publishOrganizerEvent(tenantId, eventId);
      await loadEvents(tenantId);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish event.');
    }
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
        <TenantSwitcher onChange={setTenantId} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Create Event</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreate}>
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Location ID"
              value={form.locationId}
              onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))}
              required
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
            <input
              type="date"
              className="border rounded-md px-3 py-2"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
            <input
              type="time"
              className="border rounded-md px-3 py-2"
              value={form.time}
              onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
              required
            />
            <input
              type="number"
              className="border rounded-md px-3 py-2"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              className="border rounded-md px-3 py-2"
              placeholder="Price AED"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
              required
            />
            <textarea
              className="border rounded-md px-3 py-2 md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              required
            />
            <button className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 w-fit">
              Save Draft
            </button>
          </form>
        </section>
        <section className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-3">{event.locationName}</td>
                  <td className="px-4 py-3">
                    {event.date} {event.time}
                  </td>
                  <td className="px-4 py-3 capitalize">{event.status}</td>
                  <td className="px-4 py-3">
                    {event.status !== 'published' && (
                      <button
                        onClick={() => publish(event.id)}
                        className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
};
