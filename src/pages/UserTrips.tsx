import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
];

type Tab = 'upcoming' | 'past';

const isUpcoming = (trip: EventDTO) => new Date(trip.date) >= new Date(new Date().toDateString());

export const UserTrips = () => {
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMeTrips()
      .then((response) => setTrips(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load trips'));
  }, []);

  const upcoming = trips.filter(isUpcoming);
  const past = trips.filter((t) => !isUpcoming(t));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'upcoming' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'past' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayed.map((trip) => (
          <div key={trip.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{trip.locationName}</h3>
                <p className="text-sm text-gray-600 mt-1">{trip.date} at {trip.time}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                trip.activityType === 'hiking' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>{trip.activityType}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>by {trip.organizerName}</span>
              {trip.price > 0 && <span className="font-medium text-gray-700">AED {trip.price}</span>}
              <span>{trip.slotsTotal - trip.slotsAvailable}/{trip.slotsTotal} joined</span>
            </div>
            {trip.meetingPoint && (
              <p className="text-xs text-gray-500 mt-2">📍 {trip.meetingPoint}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              {isUpcoming(trip) ? (
                <span className="text-xs font-medium text-emerald-600">✓ Confirmed</span>
              ) : (
                <span className="text-xs text-gray-400">Completed</span>
              )}
              <Link to={`/trip/${trip.id}`} className="text-emerald-700 text-sm hover:text-emerald-900">View Details →</Link>
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="col-span-full bg-white border rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              {tab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
            </p>
            {tab === 'upcoming' && (
              <Link to="/calendar" className="text-sm text-emerald-600 hover:text-emerald-700">Browse Events →</Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
