import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import { CommunityEventSpot } from '../../types';
import { getDifficultyColor, capitalize } from '../../utils';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';

interface CommunityEventCardProps {
  event: CommunityEventSpot;
}

export const CommunityEventCard = ({ event }: CommunityEventCardProps) => {
  const eventPath = `/community-event/${event.id}`;
  const imageBlock = (
    <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
      <EnvironmentImage src={event.images[0]} alt={event.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${getDifficultyColor(event.difficulty)}`}>
        {capitalize(event.difficulty)}
      </div>
      <FavoriteButton locationId={event.id} className="absolute top-12 right-3" />
      <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold">
        Community Event
      </div>
      <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <ShareButton
          title={event.name}
          text={`${event.region} · community event on UAE Trails`}
          path={eventPath}
          iconOnly
        />
      </div>
      <div className="absolute bottom-3 left-3 right-14">
        <h3 className="text-white font-bold text-base leading-snug drop-shadow-md line-clamp-2">{event.name}</h3>
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="p-4 space-y-3">
      <div className="flex items-center text-xs text-neutral-500">
        <MapPin className="w-3.5 h-3.5 mr-1 text-violet-500 shrink-0" />
        <span className="truncate font-medium">{event.region}</span>
      </div>
      {(event.distance != null || event.duration != null) && (
        <div className="flex items-center gap-2 text-xs">
          {event.distance != null && (
            <div className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
              <span className="font-semibold text-neutral-700">{event.distance} km</span>
            </div>
          )}
          {event.duration != null && (
            <div className="flex items-center gap-1 glass px-2.5 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-violet-600" />
              <span className="font-semibold text-neutral-700">{event.duration} hrs</span>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">{event.description}</p>
    </div>
  );

  return (
    <Link to={eventPath} className="group glass-card-interactive overflow-hidden hover:shadow-glass-lg block w-full max-w-full">
      {imageBlock}
      {detailsBlock}
    </Link>
  );
};
