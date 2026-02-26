import { useEffect, useState } from 'react';
import { EventDTO, NotificationDTO } from '@uaetrail/shared-types';
import { api, EventRequestView } from '../api/services';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/profile', label: 'Profile' }
];

export const UserOverview = () => {
  const [requests, setRequests] = useState<EventRequestView[]>([]);
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getMeRequests(), api.getMeTrips(), api.getMeNotifications()])
      .then(([requestsResponse, tripsResponse, notificationsResponse]) => {
        setRequests(requestsResponse.data);
        setTrips(tripsResponse.data);
        setNotifications(notificationsResponse.data.slice(0, 5));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.'));
  }, []);

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Join Requests</p>
          <p className="text-2xl font-semibold">{requests.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Approved Trips</p>
          <p className="text-2xl font-semibold">{trips.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Unread Notifications</p>
          <p className="text-2xl font-semibold">{notifications.filter((item) => !item.isRead).length}</p>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Latest Notifications</h2>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div key={notification.id} className="border rounded-md p-3">
              <p className="font-medium text-gray-900">{notification.title}</p>
              <p className="text-sm text-gray-600">{notification.body}</p>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};
