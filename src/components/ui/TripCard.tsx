import { Link } from 'react-router-dom';
import { Clock, Users, MapPin, ArrowRight } from 'lucide-react';
import { Trip } from '../../types';
import { formatPrice } from '../../utils';

interface TripCardProps {
  trip: Trip;
}

export const TripCard = ({ trip }: TripCardProps) => {
  const locationImage =
    trip.images?.[0] ??
    (trip.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'
      : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600');

  const tripParticipants = trip.participantPreviews ?? [];

  const tripDate = new Date(trip.date);
  const monthShort = tripDate.toLocaleString('en', { month: 'short' }).toUpperCase();
  const dayNum = tripDate.getDate();

  const statusStyles: Record<Trip['status'], { bg: string; text: string; label: string }> = {
    free: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Free' },
    paid: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: formatPrice(trip.price) },
    full: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', label: 'Full' }
  };

  const status = statusStyles[trip.status];
  const slotsPercent = Math.round(((trip.slotsTotal - trip.slotsAvailable) / trip.slotsTotal) * 100);
  const operatorLink = trip.tenantSlug ? `/operator/${trip.tenantSlug}` : null;

  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 hover:border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={locationImage}
          alt={trip.locationName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm min-w-[48px]">
          <p className="text-xs font-bold text-emerald-600 leading-none">{monthShort}</p>
          <p className="text-lg font-extrabold text-gray-900 leading-tight">{dayNum}</p>
        </div>
        <span
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
            trip.activityType === 'hiking' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
          }`}
        >
          {trip.activityType === 'hiking' ? 'Hiking' : 'Camping'}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {trip.title || trip.locationName}
            </h3>
          </div>
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">{trip.time}</span>
          </div>
          {trip.meetingPoint && (
            <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium truncate max-w-[50%]">{trip.meetingPoint}</span>
            </div>
          )}
        </div>

        {trip.organizerName && (
          <div
            onClick={(e) => {
              if (operatorLink) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = operatorLink;
              }
            }}
            className={`flex items-center gap-2.5 mb-3 py-2.5 border-t border-b border-gray-50 ${
              operatorLink ? 'cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition-colors' : ''
            }`}
          >
            {trip.organizerAvatar ? (
              <img
                src={trip.organizerAvatar}
                alt={trip.organizerName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold ring-2 ring-emerald-50">
                {trip.organizerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{trip.organizerName}</p>
              <p className="text-xs text-gray-400">Organizer</p>
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>
                {trip.slotsAvailable} / {trip.slotsTotal} spots left
              </span>
            </div>
            <span className="font-medium">{slotsPercent}% filled</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                slotsPercent >= 80 ? 'bg-red-400' : slotsPercent >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${slotsPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {tripParticipants.slice(0, 4).map((participant) =>
              participant.avatar ? (
                <img
                  key={participant.id}
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  title={participant.name}
                />
              ) : (
                <div
                  key={participant.id}
                  title={participant.name}
                  className="w-7 h-7 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700"
                >
                  {participant.name.charAt(0)}
                </div>
              )
            )}
            {tripParticipants.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                +{tripParticipants.length - 4}
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {trip.status !== 'full' && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <span className="block w-full text-center px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium group-hover:bg-emerald-700 transition-all">
              Request to Join
            </span>
          </div>
        )}
        {trip.status === 'full' && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <span className="block w-full text-center px-3 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium">
              Trip Full
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
