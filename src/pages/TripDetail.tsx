import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { api } from '../api/services';
import { featureFlags, fetchApiTripDetail } from '../api/public';
import { campingSpots, operators, participants, trails, trips } from '../data';
import { formatDate, formatPrice } from '../utils';
import { useAuth } from '../context/AuthContext';

interface ApiTripDetail {
  id: string;
  locationId: string;
  locationName: string;
  activityType: 'hiking' | 'camping';
  date: string;
  time: string;
  price: number;
  slotsTotal: number;
  slotsAvailable: number;
  status: 'draft' | 'published' | 'cancelled' | 'suspended';
  meetingPoint?: string | null;
  itinerary?: string[] | null;
  requirements?: string[] | null;
  organizerName: string;
  organizerAvatar?: string | null;
  description: string;
  participants: Array<{ id: string; name: string; avatar?: string }>;
  location: {
    id: string;
    description: string;
    images: string[];
  };
}

export const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [apiTrip, setApiTrip] = useState<ApiTripDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mockTrip = useMemo(() => trips.find((item) => item.id === id), [id]);
  const mockOperator = useMemo(
    () => (mockTrip ? operators.find((operator) => operator.id === mockTrip.operatorId) : null),
    [mockTrip]
  );
  const mockParticipants = useMemo(
    () => (mockTrip ? participants.filter((item) => mockTrip.participantIds.includes(item.id)) : []),
    [mockTrip]
  );
  const mockLocation = useMemo(
    () =>
      mockTrip
        ? mockTrip.activityType === 'hiking'
          ? trails.find((item) => item.id === mockTrip.locationId)
          : campingSpots.find((item) => item.id === mockTrip.locationId)
        : null,
    [mockTrip]
  );

  useEffect(() => {
    if (!id || !featureFlags.useApiTripDetail) return;
    setLoading(true);
    fetchApiTripDetail(id)
      .then((detail) => setApiTrip(detail as ApiTripDetail))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load trip details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    if (featureFlags.useApiTripDetail) {
      setError(null);
      setMessage(null);
      if (!user) {
        setError('Please sign in before requesting to join.');
        return;
      }
      try {
        await api.createJoinRequest(id);
        setMessage('Request submitted. You can track status in your dashboard.');
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : 'Failed to submit request');
      }
      return;
    }
    alert('Trip joined successfully! You will receive a confirmation email with meeting details.');
  };

  if (featureFlags.useApiTripDetail) {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading trip details...</div>;
    }
    if (!apiTrip) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
            <Link to="/calendar" className="text-emerald-600 hover:text-emerald-700 font-medium">
              View all trips
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h1 className="text-3xl font-bold text-gray-900">{apiTrip.locationName}</h1>
            <p className="text-gray-600 mt-2">{apiTrip.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                {formatDate(apiTrip.date)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                {apiTrip.time}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                {apiTrip.slotsAvailable}/{apiTrip.slotsTotal} spots
              </div>
              <div>{formatPrice(apiTrip.price)}</div>
            </div>
            {apiTrip.meetingPoint && (
              <p className="mt-4 text-sm text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                {apiTrip.meetingPoint}
              </p>
            )}
            <div className="mt-5">
              <p className="text-sm text-gray-600">Organizer</p>
              <div className="flex items-center gap-3 mt-1">
                {apiTrip.organizerAvatar && (
                  <img src={apiTrip.organizerAvatar} alt={apiTrip.organizerName} className="w-10 h-10 rounded-full" />
                )}
                <p className="font-medium text-gray-900">{apiTrip.organizerName}</p>
              </div>
            </div>
            <button onClick={handleJoin} className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
              Request to Join
            </button>
            {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
            {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!mockTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
          <Link to="/calendar" className="text-emerald-600 hover:text-emerald-700 font-medium">
            View all trips
          </Link>
        </div>
      </div>
    );
  }

  const locationImage = mockLocation?.images[0] ?? 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-80 bg-cover bg-center" style={{ backgroundImage: `url(${locationImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30" />
        <div className="relative max-w-6xl mx-auto h-full px-4 py-8 flex flex-col justify-end text-white">
          <h1 className="text-4xl font-bold">{mockTrip.locationName}</h1>
          <p className="mt-2">{formatDate(mockTrip.date)} at {mockTrip.time}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trip Details</h2>
          {mockTrip.itinerary?.length ? (
            <ul className="space-y-2 text-gray-700">
              {mockTrip.itinerary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Detailed itinerary will be published soon.</p>
          )}
          {mockTrip.requirements?.length ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">Requirements</h3>
              <ul className="space-y-1 text-gray-700">
                {mockTrip.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <div className="bg-white border rounded-lg p-6 h-fit">
          <p className="text-3xl font-semibold text-gray-900">{formatPrice(mockTrip.price)}</p>
          <p className="text-sm text-gray-600 mt-1">per person</p>
          <button onClick={handleJoin} className="w-full mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            Join This Trip
          </button>
          {mockOperator && (
            <div className="mt-5 pt-4 border-t">
              <p className="text-sm text-gray-600">Guide</p>
              <p className="font-medium text-gray-900">{mockOperator.name}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Participants</p>
            <div className="flex -space-x-2">
              {mockParticipants.slice(0, 8).map((participant) => (
                <img key={participant.id} src={participant.avatar} alt={participant.name} className="w-8 h-8 rounded-full border-2 border-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
