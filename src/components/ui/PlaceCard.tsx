import { X, MapPin, Clock, TrendingUp, Baby, Car } from 'lucide-react';
import type { Place } from '../../types/place';
import { getDifficultyColor, capitalize } from '../../utils';
import { placeDetailPath } from '../../utils/placePaths';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';
import { PlaceCatalogCardFrame, type PlaceCardActionsConfig } from './PlaceCatalogCardFrame';

interface PlaceCardProps {
  place: Place;
  actions?: PlaceCardActionsConfig;
  onDismiss?: () => void;
}

const accentForPlace = (place: Place) => {
  if (place.activityType === 'camping') {
    return { pin: 'text-amber-500', stat: 'text-amber-600', badge: 'text-emerald-700' };
  }
  if (place.activityType === 'event') {
    return { pin: 'text-violet-500', stat: 'text-violet-600', badge: 'text-violet-700' };
  }
  return { pin: 'text-emerald-500', stat: 'text-emerald-600', badge: 'text-emerald-700' };
};

const shareTextForPlace = (place: Place): string => {
  if (place.activityType === 'hiking' && place.distance != null && place.distance > 0) {
    return `${place.region} · ${place.distance} km trail on UAE Trails`;
  }
  if (place.activityType === 'camping') {
    return `${place.region} · camping on UAE Trails`;
  }
  return `${place.region} · event venue on UAE Trails`;
};

/** Unified catalog card for trail, camp, and event places. */
export const PlaceCard = ({ place, actions, onDismiss }: PlaceCardProps) => {
  const detailPath = placeDetailPath(place.activityType, place.id);
  const href = actions ? undefined : detailPath;
  const accent = accentForPlace(place);

  return (
    <PlaceCatalogCardFrame href={href} actions={actions}>
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <EnvironmentImage src={place.images[0]} alt={place.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {place.activityType === 'hiking' && place.difficulty ? (
          <div
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md ${getDifficultyColor(place.difficulty)}`}
          >
            {capitalize(place.difficulty)}
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
        {place.activityType === 'hiking' && place.childFriendly ? (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Baby className="h-3 w-3" />
            Kid-friendly
          </div>
        ) : null}
        {place.activityType === 'camping' && place.accessibility === 'car-accessible' ? (
          <div className={`absolute top-3 left-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-xs font-semibold ${accent.badge}`}>
            <Car className="h-3 w-3" />
            Car access
          </div>
        ) : null}
        <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <ShareButton title={place.name} text={shareTextForPlace(place)} path={detailPath} iconOnly />
        </div>
        <div className="absolute bottom-3 left-3 right-14">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">{place.name}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center text-xs text-neutral-500">
          <MapPin className={`mr-1 h-3.5 w-3.5 shrink-0 ${accent.pin}`} />
          <span className="truncate font-medium">{place.region}</span>
        </div>
        {place.activityType === 'hiking' &&
        ((place.distance != null && place.distance > 0) || (place.duration != null && place.duration > 0)) ? (
          <div className="flex items-center gap-2 text-xs">
            {place.distance != null && place.distance > 0 ? (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <TrendingUp className={`h-3.5 w-3.5 ${accent.stat}`} />
                <span className="font-semibold text-neutral-700">{place.distance} km</span>
              </div>
            ) : null}
            {place.duration != null && place.duration > 0 ? (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <Clock className={`h-3.5 w-3.5 ${accent.stat}`} />
                <span className="font-semibold text-neutral-700">{place.duration} hrs</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{place.description}</p>
      </div>
    </PlaceCatalogCardFrame>
  );
};

/** @deprecated Use {@link PlaceCard} with a hiking {@link Place}. */
export const TrailCard = ({
  trail,
  actions,
  onDismiss,
}: {
  trail: Omit<Place, 'activityType'>;
  actions?: PlaceCardActionsConfig;
  onDismiss?: () => void;
}) => <PlaceCard place={{ ...trail, activityType: 'hiking' }} actions={actions} onDismiss={onDismiss} />;

/** @deprecated Use {@link PlaceCard} with a camping {@link Place}. */
export const CampingCard = ({
  camp,
  actions,
  onDismiss,
}: {
  camp: Omit<Place, 'activityType' | 'distance' | 'duration' | 'elevation' | 'childFriendly'> &
    Partial<Pick<Place, 'distance' | 'duration' | 'elevation' | 'childFriendly'>>;
  actions?: PlaceCardActionsConfig;
  onDismiss?: () => void;
}) => <PlaceCard place={{ ...camp, activityType: 'camping', childFriendly: camp.childFriendly ?? false }} actions={actions} onDismiss={onDismiss} />;
