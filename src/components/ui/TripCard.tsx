import { Link } from 'react-router-dom';
import { Calendar, Clock, Users } from 'lucide-react';
import { Trip } from '../../types';
import { operators, participants } from '../../data';
import { formatDate, formatPrice } from '../../utils';

interface TripCardProps {
  trip: Trip;
  onJoin?: () => void;
}

export const TripCard = ({ trip, onJoin }: TripCardProps) => {
  const operator = operators.find((item) => item.id === trip.operatorId);
  const tripParticipants = participants.filter((item) => trip.participantIds.includes(item.id));

  const statusColor: Record<Trip['status'], string> = {
    free: 'bg-green-100 text-green-800',
    paid: 'bg-blue-100 text-blue-800',
    full: 'bg-gray-100 text-gray-800'
  };

  return (
    <Link to={`/trip/${trip.id}`} className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{trip.locationName}</h3>
          <span
            className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trip.activityType === 'hiking' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {trip.activityType === 'hiking' ? 'Hiking' : 'Camping'}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[trip.status]}`}>
          {formatPrice(trip.price)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(trip.date)}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>{trip.time}</span>
        </div>
      </div>

      {operator && (
        <div className="flex items-center mb-3 pb-3 border-b">
          <img src={operator.avatar} alt={operator.name} className="w-10 h-10 rounded-full mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">{operator.name}</p>
            <p className="text-xs text-gray-500">{operator.experience}</p>
          </div>
        </div>
      )}

      {!operator && trip.organizerName && (
        <div className="flex items-center mb-3 pb-3 border-b">
          {trip.organizerAvatar && (
            <img src={trip.organizerAvatar} alt={trip.organizerName} className="w-10 h-10 rounded-full mr-3" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{trip.organizerName}</p>
            <p className="text-xs text-gray-500">Organizer</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Users className="w-4 h-4 mr-1" />
            <span>
              {trip.slotsAvailable} / {trip.slotsTotal} spots left
            </span>
          </div>
          <div className="flex -space-x-2">
            {tripParticipants.slice(0, 5).map((participant) => (
              <img
                key={participant.id}
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full border-2 border-white"
                title={participant.name}
              />
            ))}
            {tripParticipants.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{tripParticipants.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm font-medium text-emerald-600">View Details →</div>
      </div>
      {onJoin && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onJoin();
          }}
          className="mt-3 w-full px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
        >
          Quick Join
        </button>
      )}
    </Link>
  );
};
