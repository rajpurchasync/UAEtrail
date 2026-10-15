import { Baby, Clock, TrendingUp, Users } from 'lucide-react';
import { hasPositiveNumber } from '../../../utils/venueDetailDisplay';
import type { PlaceDetailHeroKindSectionProps } from './placeDetailHeroKindSectionProps';

/** Venue (`/venue/:id`) hero facts — capacity, route hints, family-friendly. */
export const EventPlaceDetailHeroStats = ({ place }: PlaceDetailHeroKindSectionProps) => {
  const show =
    hasPositiveNumber(place.distance) ||
    hasPositiveNumber(place.duration) ||
    (place.maxGroupSize != null && place.maxGroupSize > 0) ||
    place.childFriendly;

  if (!show) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {hasPositiveNumber(place.distance) ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="text-sm">Route</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{place.distance} km</div>
        </div>
      ) : null}
      {hasPositiveNumber(place.duration) ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Clock className="w-5 h-5 mr-2" />
            <span className="text-sm">Duration</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{place.duration} hrs</div>
        </div>
      ) : null}
      {place.maxGroupSize != null && place.maxGroupSize > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Users className="w-5 h-5 mr-2" />
            <span className="text-sm">Capacity</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{place.maxGroupSize}</div>
        </div>
      ) : null}
      {place.childFriendly ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Baby className="w-5 h-5 mr-2" />
            <span className="text-sm">Family</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">Kid-friendly</div>
        </div>
      ) : null}
    </div>
  );
};
