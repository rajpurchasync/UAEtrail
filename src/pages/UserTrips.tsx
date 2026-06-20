import { useEffect, useState } from 'react';
import { EventDTO } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ReviewPromptBanner } from '../components/ui/ReviewPromptBanner';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'Join Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
];

type Tab = 'upcoming' | 'past';

const isUpcoming = (trip: EventDTO) => new Date(trip.date) >= new Date(new Date().toDateString());

const daysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return '';
  return `In ${diff} days`;
};

export const UserTrips = () => {
  const [trips, setTrips] = useState<EventDTO[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getMeTrips()
      .then((response) => setTrips(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = trips.filter(isUpcoming);
  const past = trips.filter((t) => !isUpcoming(t));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <DashboardLayout title="User Dashboard" links={userLinks}>
      <ReviewPromptBanner />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{upcoming.length}</p>
          <p className="text-xs text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{past.length}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{trips.length}</p>
          <p className="text-xs text-gray-500">Total Trips</p>
        </div>
      </div>

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

      {loading ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading trips...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayed.map((trip) => (
          <div key={trip.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{trip.title || trip.locationName}</h3>
                {trip.title && <p className="text-xs text-gray-500">{trip.locationName}</p>}
                <p className="text-sm text-gray-600 mt-1">{trip.date} at {trip.time}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  trip.activityType === 'hiking' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>{trip.activityType}</span>
                {isUpcoming(trip) && (
                  <span className="text-xs text-emerald-600 font-medium">{daysUntil(trip.date)}</span>
                )}
              </div>
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
              {trip.status === 'cancelled' ? (
                <span className="text-xs font-medium text-red-600">Event Cancelled</span>
              ) : trip.status === 'suspended' ? (
                <span className="text-xs font-medium text-orange-600">Event Suspended</span>
              ) : isUpcoming(trip) ? (
                <span className="text-xs font-medium text-emerald-600">✓ Confirmed &middot; Check-in on site</span>
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
              <Link to="/trips" className="text-sm text-emerald-600 hover:text-emerald-700">Browse Events →</Link>
            )}
          </div>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};
