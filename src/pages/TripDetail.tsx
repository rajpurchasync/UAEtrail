import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  MessageSquare,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { EventDetailDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { formatDate, formatPrice } from '../utils';
import { useAuth } from '../context/AuthContext';
import { PARTICIPANT_PRIVACY } from '../config/platform';
import { PageMeta } from '../components/seo/PageMeta';

export const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<EventDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getPublicEventDetail(id)
      .then((res) => setTrip(res.data))
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Failed to load trip details')
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id || !trip) return;
    if (!user) {
      navigate('/signin', { state: { from: `/trip/${id}` } });
      return;
    }
    setJoining(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.createJoinRequest(id);
      if (res.data.waitlisted || res.data.status === 'waitlisted') {
        setMessage('Added to waitlist. We will notify you when a spot opens.');
      } else {
        setMessage('Request submitted. Track status in your dashboard.');
      }
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to submit request');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
          <Link to="/trips" className="text-emerald-600 hover:text-emerald-700 font-medium">
            View all trips
          </Link>
        </div>
      </div>
    );
  }

  const heroImage =
    trip.images?.[0] ??
    trip.location.images?.[0] ??
    (trip.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600'
      : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600');

  const participants = trip.participants ?? [];
  const previewParticipants = PARTICIPANT_PRIVACY.showPreJoin
    ? participants.slice(0, PARTICIPANT_PRIVACY.maxPreviewCount)
    : [];
  const isFull = trip.slotsAvailable <= 0;
  const locationPath =
    trip.activityType === 'hiking' ? `/trail/${trip.locationId}` : `/camp/${trip.locationId}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <PageMeta
        title={trip.title || trip.locationName}
        description={trip.description?.slice(0, 160) ?? `Join this ${trip.activityType} trip on UAE Trail`}
        path={`/trip/${trip.id}`}
      />
      {/* Hero */}
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
        <img src={heroImage} alt={trip.locationName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 max-w-6xl mx-auto">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
              trip.activityType === 'hiking' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
            }`}
          >
            {trip.activityType === 'hiking' ? 'Hiking' : 'Camping'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{trip.title || trip.locationName}</h1>
          <p className="text-white/90 mt-1 text-sm md:text-base">
            {formatDate(trip.date)} · {trip.time}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About this trip</h2>
            <p className="text-gray-600 leading-relaxed">{trip.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(trip.date)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-semibold text-gray-900">{trip.time}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Users className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs text-gray-500">Spots</p>
                <p className="text-sm font-semibold text-gray-900">
                  {trip.slotsAvailable}/{trip.slotsTotal} left
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-sm font-semibold text-gray-900">{formatPrice(trip.price)}</p>
              </div>
            </div>

            {trip.meetingPoint && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Meeting point</p>
                  <p>{trip.meetingPoint}</p>
                </div>
              </div>
            )}

            <Link
              to={locationPath}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View location details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Itinerary</h2>
              <ul className="space-y-2">
                {trip.itinerary.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {trip.requirements && trip.requirements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Requirements</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                {trip.requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {trip.images && trip.images.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {trip.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="rounded-xl aspect-video object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-20">
            <p className="text-2xl font-bold text-gray-900">{formatPrice(trip.price)}</p>
            <p className="text-sm text-gray-500">per person</p>

            {!isFull ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="hidden md:block w-full mt-4 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {joining ? 'Submitting…' : 'Request to Join'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="hidden md:block w-full mt-4 px-4 py-3 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-60 transition-colors"
              >
                {joining ? 'Submitting…' : 'Join Waitlist'}
              </button>
            )}

            {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>}
            {error && <p className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>}

            {/* Organizer */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Organizer</p>
              <Link
                to={`/operator/${trip.tenantSlug}`}
                className="flex items-center gap-3 group"
              >
                {trip.organizerAvatar ? (
                  <img
                    src={trip.organizerAvatar}
                    alt={trip.organizerName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-50"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {trip.organizerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                    {trip.organizerName}
                  </p>
                  <p className="text-xs text-gray-500">View profile</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              {user && trip.organizerId && (
                <button
                  onClick={() => navigate(`/dashboard/messages?to=${trip.organizerId}`)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message organizer
                </button>
              )}
            </div>

            {/* Participants */}
            {PARTICIPANT_PRIVACY.showPreJoin && previewParticipants.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Who&apos;s going ({participants.length})
                </p>
                <div className="flex -space-x-2">
                  {previewParticipants.map((p) =>
                    p.avatar && PARTICIPANT_PRIVACY.showAvatar ? (
                      <img
                        key={p.id}
                        src={p.avatar}
                        alt={p.name}
                        title={p.name}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <div
                        key={p.id}
                        title={p.name}
                        className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700"
                      >
                        {p.name.charAt(0)}
                      </div>
                    )
                  )}
                  {participants.length > previewParticipants.length && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      +{participants.length - previewParticipants.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-4 pb-safe">
        <button
          onClick={handleJoin}
          disabled={joining}
          className={`w-full px-4 py-3.5 text-white text-sm font-semibold rounded-xl shadow-lg disabled:opacity-60 transition-colors ${
            isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {joining ? 'Submitting…' : isFull ? 'Join Waitlist' : 'Request to Join'}
        </button>
      </div>
    </div>
  );
};
