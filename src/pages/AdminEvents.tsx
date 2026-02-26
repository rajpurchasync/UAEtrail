import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

export const AdminEvents = () => {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const response = await api.getAdminEvents();
      setEvents(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load events');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const moderate = async (eventId: string, action: 'suspend' | 'unsuspend') => {
    try {
      await api.moderateEvent(eventId, action);
      await loadEvents();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : 'Failed to update event');
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Organizer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{event.locationName}</p>
                  <p className="text-xs text-gray-500">{event.activityType}</p>
                </td>
                <td className="px-4 py-3">
                  {event.date} {event.time}
                </td>
                <td className="px-4 py-3">{event.organizerName}</td>
                <td className="px-4 py-3 capitalize">{event.status}</td>
                <td className="px-4 py-3">
                  {event.status === 'suspended' ? (
                    <button
                      onClick={() => moderate(event.id, 'unsuspend')}
                      className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => moderate(event.id, 'suspend')}
                      className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
