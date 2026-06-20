import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, Baby } from 'lucide-react';
import { Trail } from '../../types';
import { getDifficultyColor, capitalize } from '../../utils';
import { FavoriteButton } from './FavoriteButton';

interface TrailCardProps {
  trail: Trail;
}

export const TrailCard = ({ trail }: TrailCardProps) => {
  return (
    <Link
      to={`/trail/${trail.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <img
          src={trail.images[0]}
          alt={trail.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getDifficultyColor(trail.difficulty)}`}>
          {capitalize(trail.difficulty)}
        </div>
        <FavoriteButton locationId={trail.id} className="absolute top-12 right-3" />
        {trail.childFriendly && (
          <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Baby className="w-3 h-3" />
            Kid-friendly
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-1">{trail.name}</h3>
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-center text-xs text-gray-500 mb-2.5">
          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500 flex-shrink-0" />
          <span className="truncate">{trail.region}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">{trail.distance} km</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">{trail.duration} hrs</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{trail.description}</p>
      </div>
    </Link>
  );
};
