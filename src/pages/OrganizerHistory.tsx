import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

interface HistoryEvent {
  id: string;
  title: string;
  locationName: string;
  activityType: string;
  startAt: string;
  status: string;
  capacity: number;
  participantCount: number;
  checkedInCount: number;
}

export const OrganizerHistory = () => {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tenantId = localStorage.getItem('uaetrail_tenant') ?? '';

  useEffect(() => {
    if (!tenantId) {
      setError('No tenant selected. Please select a tenant first.');
      setLoading(false);
      return;
    }
    api.getEventHistory(tenantId)
      .then((res) => setEvents(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Events</h2>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Participants</th>
              <th className="px-4 py-3 text-left">Check-in Rate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No past events</td></tr>
            ) : events.map((e) => {
              const rate = e.participantCount > 0 ? Math.round((e.checkedInCount / e.participantCount) * 100) : 0;
              return (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{e.activityType}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.locationName}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(e.startAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(e.status)}</td>
                  <td className="px-4 py-3 text-gray-700">{e.participantCount}/{e.capacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{e.checkedInCount}/{e.participantCount}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
