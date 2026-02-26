import { useEffect, useMemo, useState } from 'react';
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
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerOverview = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([api.getOrganizerEvents(tenantId), api.getOrganizerRequests(tenantId)])
      .then(([eventsResponse, requestsResponse]) => {
        setEvents(eventsResponse.data);
        setPendingRequests(requestsResponse.data.filter((request) => request.status === 'pending').length);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load organizer data'));
  }, [tenantId]);

  const publishedCount = useMemo(() => events.filter((item) => item.status === 'published').length, [events]);

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="space-y-4">
        <TenantSwitcher onChange={(value) => setTenantId(value)} />
        {!tenantId && <p className="text-sm text-amber-700">Set your tenant ID to load organizer data.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-semibold">{events.length}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Published Events</p>
            <p className="text-2xl font-semibold">{publishedCount}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending Join Requests</p>
            <p className="text-2xl font-semibold">{pendingRequests}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
