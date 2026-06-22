import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, Baby } from 'lucide-react';
import { Trail } from '../../types';
import { getDifficultyColor, capitalize } from '../../utils';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';

interface TrailCardProps {
  trail: Trail;
}

export const TrailCard = ({ trail }: TrailCardProps) => {
  const imageBlock = (
    <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
      <img src={trail.images[0]} alt={trail.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${getDifficultyColor(trail.difficulty)}`}>
        {capitalize(trail.difficulty)}
      </div>
      <FavoriteButton locationId={trail.id} className="absolute top-12 right-3" />
      {trail.childFriendly && (
        <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Baby className="w-3 h-3" />
          Kid-friendly
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <ShareButton
          title={trail.name}
          text={`${trail.region} · ${trail.distance} km trail on UAE Trails`}
          path={`/trail/${trail.id}`}
          iconOnly
        />
      </div>
      <div className="absolute bottom-3 left-3 right-14">
        <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-2">{trail.name}</h3>
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="p-4 space-y-3">
      <div className="flex items-center text-xs text-neutral-500">
        <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500 shrink-0" />
        <span className="truncate font-medium">{trail.region}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-xl">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-neutral-700">{trail.distance} km</span>
        </div>
        <div className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-neutral-700">{trail.duration} hrs</span>
        </div>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">{trail.description}</p>
    </div>
  );

  return (
    <Link to={`/trail/${trail.id}`} className="group glass-card-interactive overflow-hidden hover:shadow-glass-lg block">
      {imageBlock}
      {detailsBlock}
    </Link>
  );
};
