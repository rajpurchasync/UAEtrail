import { Link } from 'react-router-dom';
import { MapPin, Users, Tent, Car } from 'lucide-react';
import { CampingSpot } from '../../types';
import { capitalize } from '../../utils';
import { FavoriteButton } from './FavoriteButton';

interface CampingCardProps {
  camp: CampingSpot;
}

export const CampingCard = ({ camp }: CampingCardProps) => {
  return (
    <Link
      to={`/camp/${camp.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <img
          src={camp.images[0]}
          alt={camp.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/90 backdrop-blur-sm text-amber-800">
          {camp.campingType === 'operator-led' ? 'Guided' : 'Self-Guided'}
        </div>
        <FavoriteButton locationId={camp.id} className="absolute top-12 right-3" />
        {camp.accessibility === 'car-accessible' && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Car className="w-3 h-3" />
            Car access
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-1">{camp.name}</h3>
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-center text-xs text-gray-500 mb-2.5">
          <MapPin className="w-3.5 h-3.5 mr-1 text-amber-500 flex-shrink-0" />
          <span className="truncate">{camp.region}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">Max {camp.maxGroupSize}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
            <Tent className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">{capitalize(camp.campingType)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{camp.description}</p>
      </div>
    </Link>
  );
};
