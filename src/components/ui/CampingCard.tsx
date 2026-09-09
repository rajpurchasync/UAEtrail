import { X, MapPin, Car } from 'lucide-react';
import { CampingSpot } from '../../types';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';
import {
  LocationCatalogCardFrame,
  type LocationCardActionsConfig,
} from './LocationCatalogCardFrame';

interface CampingCardProps {
  camp: CampingSpot;
  actions?: LocationCardActionsConfig;
  onDismiss?: () => void;
}

export const CampingCard = ({ camp, actions, onDismiss }: CampingCardProps) => {
  const campPath = `/camp/${camp.id}`;
  const href = actions ? undefined : campPath;

  return (
    <LocationCatalogCardFrame href={href} actions={actions}>
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <EnvironmentImage src={camp.images[0]} alt={camp.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <FavoriteButton locationId={camp.id} className="absolute top-3 right-3" />
        )}
        {camp.accessibility === 'car-accessible' && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Car className="h-3 w-3" />
            Car access
          </div>
        )}
        <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <ShareButton
            title={camp.name}
            text={`${camp.region} · camping on UAE Trails`}
            path={campPath}
            iconOnly
          />
        </div>
        <div className="absolute bottom-3 left-3 right-14">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">{camp.name}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center text-xs text-neutral-500">
          <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate font-medium">{camp.region}</span>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{camp.description}</p>
      </div>
    </LocationCatalogCardFrame>
  );
};
