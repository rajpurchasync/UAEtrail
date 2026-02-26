import { Link } from 'react-router-dom';
import { MapPin, Users, Tent, Car } from 'lucide-react';
import { CampingSpot } from '../../types';
import { capitalize } from '../../utils';

interface CampingCardProps {
  camp: CampingSpot;
}

export const CampingCard = ({ camp }: CampingCardProps) => {
  return (
    <Link
      to={`/camp/${camp.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="relative h-48">
        <img
          src={camp.images[0]}
          alt={camp.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          {camp.campingType === 'operator-led' ? 'Guided' : 'Self-Guided'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{camp.name}</h3>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{camp.region}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>Max {camp.maxGroupSize}</span>
          </div>
          <div className="flex items-center">
            <Tent className="w-4 h-4 mr-1" />
            <span>{capitalize(camp.campingType)}</span>
          </div>
          {camp.accessibility === 'car-accessible' && (
            <div className="flex items-center text-emerald-600">
              <Car className="w-4 h-4 mr-1" />
              <span>Car access</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{camp.description}</p>
      </div>
    </Link>
  );
};
