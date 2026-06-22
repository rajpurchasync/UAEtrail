import { Link } from 'react-router-dom';
import { MapPin, Car } from 'lucide-react';
import { CampingSpot } from '../../types';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';

interface CampingCardProps {
  camp: CampingSpot;
}

export const CampingCard = ({ camp }: CampingCardProps) => {
  const imageBlock = (
    <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
      <img src={camp.images[0]} alt={camp.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <FavoriteButton locationId={camp.id} className="absolute top-3 right-3" />
      {camp.accessibility === 'car-accessible' && (
        <div className="absolute top-3 left-3 glass text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Car className="w-3 h-3" />
          Car access
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <ShareButton
          title={camp.name}
          text={`${camp.region} · camping on UAE Trails`}
          path={`/camp/${camp.id}`}
          iconOnly
        />
      </div>
      <div className="absolute bottom-3 left-3 right-14">
        <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-2">{camp.name}</h3>
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="p-4 space-y-3">
      <div className="flex items-center text-xs text-neutral-500">
        <MapPin className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
        <span className="truncate font-medium">{camp.region}</span>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">{camp.description}</p>
    </div>
  );

  return (
    <Link to={`/camp/${camp.id}`} className="group glass-card-interactive overflow-hidden hover:shadow-glass-lg block">
      {imageBlock}
      {detailsBlock}
    </Link>
  );
};
