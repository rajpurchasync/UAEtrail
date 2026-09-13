import { X, MapPin, Clock, TrendingUp, Baby } from 'lucide-react';
import { Trail } from '../../types';
import { getDifficultyColor, capitalize } from '../../utils';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';
import {
  PlaceCatalogCardFrame,
  type PlaceCardActionsConfig,
} from './PlaceCatalogCardFrame';

interface TrailCardProps {
  trail: Trail;
  actions?: PlaceCardActionsConfig;
  onDismiss?: () => void;
}

export const TrailCard = ({ trail, actions, onDismiss }: TrailCardProps) => {
  const trailPath = `/trail/${trail.id}`;
  const href = actions ? undefined : trailPath;

  return (
    <PlaceCatalogCardFrame href={href} actions={actions}>
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <EnvironmentImage src={trail.images[0]} alt={trail.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {trail.difficulty ? (
          <div
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md ${getDifficultyColor(trail.difficulty)}`}
          >
            {capitalize(trail.difficulty)}
          </div>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-12 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {trail.childFriendly && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Baby className="h-3 w-3" />
            Kid-friendly
          </div>
        )}
        <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <ShareButton
            title={trail.name}
            text={
              trail.distance != null && trail.distance > 0
                ? `${trail.region} · ${trail.distance} km trail on UAE Trails`
                : `${trail.region} · hiking trail on UAE Trails`
            }
            path={trailPath}
            iconOnly
          />
        </div>
        <div className="absolute bottom-3 left-3 right-14">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">{trail.name}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center text-xs text-neutral-500">
          <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="truncate font-medium">{trail.region}</span>
        </div>
        {(trail.distance != null && trail.distance > 0) || (trail.duration != null && trail.duration > 0) ? (
          <div className="flex items-center gap-2 text-xs">
            {trail.distance != null && trail.distance > 0 && (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold text-neutral-700">{trail.distance} km</span>
              </div>
            )}
            {trail.duration != null && trail.duration > 0 && (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold text-neutral-700">{trail.duration} hrs</span>
              </div>
            )}
          </div>
        ) : null}
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{trail.description}</p>
      </div>
    </PlaceCatalogCardFrame>
  );
};
