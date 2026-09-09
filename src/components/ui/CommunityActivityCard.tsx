import { X, MapPin, Clock, TrendingUp } from 'lucide-react';
import { CommunityActivitySpot } from '../../types';
import { VENUE_TYPE_LABELS } from '../../config/activityTypes';
import { getDifficultyColor, capitalize } from '../../utils';
import { venueLocationPath } from '../../utils/venueDetailDisplay';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';
import {
  LocationCatalogCardFrame,
  type LocationCardActionsConfig,
} from './LocationCatalogCardFrame';

interface CommunityActivityCardProps {
  event: CommunityActivitySpot;
  actions?: LocationCardActionsConfig;
  onDismiss?: () => void;
}

export const CommunityActivityCard = ({ event, actions, onDismiss }: CommunityActivityCardProps) => {
  const eventPath = venueLocationPath('event', event.id);
  const href = actions ? undefined : eventPath;

  return (
    <LocationCatalogCardFrame href={href} actions={actions}>
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <EnvironmentImage src={event.images[0]} alt={event.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {event.difficulty ? (
          <div
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md ${getDifficultyColor(event.difficulty)}`}
          >
            {capitalize(event.difficulty)}
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
        ) : (
          <FavoriteButton locationId={event.id} className="absolute top-12 right-3" />
        )}
        <div className="absolute top-3 left-3 rounded-full bg-violet-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {VENUE_TYPE_LABELS.event}
        </div>
        <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <ShareButton
            title={event.name}
            text={`${event.region} · ${VENUE_TYPE_LABELS.event.toLowerCase()} on UAE Trails`}
            path={eventPath}
            iconOnly
          />
        </div>
        <div className="absolute bottom-3 left-3 right-14">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">{event.name}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center text-xs text-neutral-500">
          <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-violet-500" />
          <span className="truncate font-medium">{event.region}</span>
        </div>
        {(event.distance != null || event.duration != null) && (
          <div className="flex items-center gap-2 text-xs">
            {event.distance != null && (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                <span className="font-semibold text-neutral-700">{event.distance} km</span>
              </div>
            )}
            {event.duration != null && (
              <div className="flex items-center gap-1 rounded-xl glass px-2.5 py-1.5">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
                <span className="font-semibold text-neutral-700">{event.duration} hrs</span>
              </div>
            )}
          </div>
        )}
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{event.description}</p>
      </div>
    </LocationCatalogCardFrame>
  );
};
