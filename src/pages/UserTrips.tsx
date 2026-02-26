import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/profile', label: 'Profile' }
];

export const UserTrips = () => {
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMeTrips()
      .then((response) => setTrips(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load trips'));
  }, []);

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">{trip.locationName}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {trip.date} {trip.time}
            </p>
            <p className="text-sm text-gray-600 mt-1">Organizer: {trip.organizerName}</p>
            <Link className="text-emerald-700 text-sm mt-3 inline-block hover:text-emerald-900" to={`/trip/${trip.id}`}>
              View Trip
            </Link>
          </div>
        ))}
        {trips.length === 0 && (
          <div className="bg-white border rounded-lg p-4 text-sm text-gray-600">No approved trips yet.</div>
        )}
      </div>
    </DashboardLayout>
  );
};
