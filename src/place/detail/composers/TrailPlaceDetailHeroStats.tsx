import { Baby, Clock, Mountain, TrendingUp } from 'lucide-react';
import { hasPositiveNumber } from '../../../utils/venueDetailDisplay';
import type { PlaceDetailHeroKindSectionProps } from './placeDetailHeroKindSectionProps';

/** Trail (`/trail/:id`) hero stats — distance, duration, elevation, family. */
export const TrailPlaceDetailHeroStats = ({ place }: PlaceDetailHeroKindSectionProps) => {
  const show =
    hasPositiveNumber(place.distance) ||
    hasPositiveNumber(place.duration) ||
    hasPositiveNumber(place.elevation) ||
    place.childFriendly;

  if (!show) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {hasPositiveNumber(place.distance) ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="text-sm">Distance</span>
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
      {hasPositiveNumber(place.elevation) ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-600 mb-1">
            <Mountain className="w-5 h-5 mr-2" />
            <span className="text-sm">Elevation</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{place.elevation} m</div>
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
