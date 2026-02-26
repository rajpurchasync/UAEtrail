import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, Baby } from 'lucide-react';
import { Trail } from '../../types';
import { getDifficultyColor, capitalize } from '../../utils';

interface TrailCardProps {
  trail: Trail;
}

export const TrailCard = ({ trail }: TrailCardProps) => {
  return (
    <Link
      to={`/trail/${trail.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="relative h-48">
        <img
          src={trail.images[0]}
          alt={trail.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(trail.difficulty)}`}>
          {capitalize(trail.difficulty)}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{trail.name}</h3>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{trail.region}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{trail.distance} km</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{trail.duration} hrs</span>
          </div>
          {trail.childFriendly && (
            <div className="flex items-center text-emerald-600">
              <Baby className="w-4 h-4 mr-1" />
              <span>Kid-friendly</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{trail.description}</p>
      </div>
    </Link>
  );
};
