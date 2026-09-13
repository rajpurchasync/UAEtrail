import type { SyntheticEvent } from 'react';
import { ChevronRight, Clock, MapPin, Route, Star, Tag, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel, ExploreCardTone } from '../../explore/exploreCardModel';
import { exploreCardToneClass, exploreCardToneTextClass } from '../../explore/exploreCardModel';
import type { ExploreCardDetail, ExploreCardDetailIcon, ExploreCardSections } from '../../explore/exploreCopy';
import { personProfilePath, resolveOrganisationProfilePath } from '../../utils/hostLinks';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';
import { capitalize } from '../../utils';
import { explorePersonRoleLabel } from '@uaetrail/shared-types';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ParticipantPreview } from '../ui/ParticipantPreview';

const detailIcon = (icon: ExploreCardDetailIcon) => {
  switch (icon) {
    case 'location':
      return MapPin;
    case 'time':
      return Clock;
    case 'spots':
      return Users;
    case 'route':
      return Route;
    case 'price':
      return Tag;
    default:
      return MapPin;
  }
};

/** Primary title — one clear line, easy to scan. */
export const ExploreCardHeadline = ({
  sections,
  size = 'lg',
  tone = 'hiking',
}: {
  sections: ExploreCardSections;
  size?: 'sm' | 'lg';
  tone?: ExploreCardTone;
}) => {
  const textClass = size === 'lg' ? 'text-xl font-bold leading-snug' : 'text-[17px] font-bold leading-snug';
  const highlightClass = exploreCardToneTextClass[tone];

  if (sections.plainTitle) {
    return <p className={`text-gray-900 ${textClass}`}>{sections.plainTitle}</p>;
  }

  if (sections.titleText && sections.hostName) {
    return (
      <p className={`text-gray-900 ${textClass}`}>
        {sections.titleText}
        <span className="font-normal text-gray-500"> · </span>
        <span className="font-semibold text-gray-700">{sections.hostName}</span>
      </p>
    );
  }

  if (sections.highlightName) {
    return (
      <p className={`text-gray-900 ${textClass}`}>
        <span>{sections.highlightName}</span>
        {sections.suffix && <span>{sections.suffix}</span>}
        {sections.activityHighlight && (
          <span className={highlightClass}>{sections.activityHighlight}</span>
        )}
        {sections.dateHighlight && <span>{sections.dateHighlight}</span>}
      </p>
    );
  }

  return null;
};

/** Venue / shop / agency aggregate rating from community reviews. */
export const ExploreCardRatingRow = ({
  card,
  compact = false,
}: {
  card: ExploreCardModel;
  compact?: boolean;
}) => {
  if (card.source !== 'venue' && card.source !== 'shop' && card.source !== 'agency') return null;

  const spacing = compact ? 'mt-1' : 'mt-2';

  if (!card.reviewCount) {
    return (
      <p className={`${spacing} flex items-center gap-1.5 text-sm font-medium text-gray-500`}>
        <Star className="h-4 w-4 text-amber-300" aria-hidden />
        No reviews yet
      </p>
    );
  }

  return (
    <p className={`${spacing} flex items-center gap-1.5 text-sm font-semibold text-gray-800`}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      {card.averageRating?.toFixed(1)} · {card.reviewCount} review{card.reviewCount === 1 ? '' : 's'}
    </p>
  );
};

export type MapFocusCoords = { lat: number; lng: number };

/** Location label — city name plus a map action to the pinned spot. */
export const ExploreCardLocationLink = ({
  label,
  latitude,
  longitude,
  onFocusMap,
  className = '',
  iconClassName = 'h-4 w-4 shrink-0 text-gray-400',
}: {
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  onFocusMap?: (coords: MapFocusCoords) => void;
  className?: string;
  iconClassName?: string;
}) => {
  const hasCoords = latitude != null && longitude != null;
  const linkClass =
    'inline-flex items-center gap-1 font-medium text-emerald-700 underline decoration-emerald-700/30 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-800';

  const focusMap = (event: SyntheticEvent) => {
    event.stopPropagation();
    if (latitude == null || longitude == null) return;
    onFocusMap?.({ lat: latitude, lng: longitude });
  };

  const viewLocationAction =
    hasCoords && onFocusMap ? (
      <span
        role="link"
        tabIndex={0}
        onClick={focusMap}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          focusMap(event);
        }}
        className={`${linkClass} cursor-pointer`}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        View location
      </span>
    ) : hasCoords ? (
      <a
        href={buildGoogleMapsSearchUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={linkClass}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        View location
      </a>
    ) : null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <MapPin className={iconClassName} aria-hidden />
        <span className="font-medium text-gray-700">{label}</span>
      </span>
      {viewLocationAction ? (
        <>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          {viewLocationAction}
        </>
      ) : null}
    </span>
  );
};

/** Secondary facts — muted, spaced, never crammed into the title. */
export const ExploreCardDetailList = ({
  details,
  compact = false,
  mapLatitude,
  mapLongitude,
  onFocusMap,
}: {
  details: ExploreCardDetail[];
  compact?: boolean;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  onFocusMap?: (coords: MapFocusCoords) => void;
}) => {
  if (details.length === 0) return null;

  if (compact) {
    const locationDetail = details.find((detail) => detail.icon === 'location');
    if (locationDetail) {
      return (
        <ExploreCardLocationLink
          label={locationDetail.label}
          latitude={mapLatitude}
          longitude={mapLongitude}
          onFocusMap={onFocusMap}
          className="mt-2 text-sm text-gray-600"
        />
      );
    }

    return (
      <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600">
        {details.map((detail) => detail.label).join(' · ')}
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2.5">
      {details.map((detail) => {
        const Icon = detailIcon(detail.icon);
        const isLocation = detail.icon === 'location';
        return (
          <li
            key={`${detail.icon}-${detail.label}`}
            className="flex items-start gap-2.5 text-sm leading-snug text-gray-600"
          >
            {isLocation && mapLatitude != null && mapLongitude != null ? (
              <ExploreCardLocationLink
                label={detail.label}
                latitude={mapLatitude}
                longitude={mapLongitude}
                onFocusMap={onFocusMap}
                className="items-start"
                iconClassName="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
              />
            ) : (
              <>
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                <span>{detail.label}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const ExploreCardRequirementBadges = ({ badges }: { badges: string[] }) => {
  if (badges.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge}
          className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700"
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

export const ExploreCardPeopleRow = ({ card }: { card: ExploreCardModel }) => {
  const participants = card.participantPreviews ?? [];
  const person = card.featuredPerson;
  const hostName = card.listHost ?? person?.displayName ?? card.sections.hostName ?? card.sections.highlightName;
  const hostPath =
    card.source === 'activity'
      ? resolveOrganisationProfilePath({
          tenantSlug: card.activity?.tenantSlug,
          hostUserId: card.activity?.hostUserId ?? person?.userId,
        })
      : personProfilePath(person?.userId ?? card.requesterUserId);
  const personRoleLabel = person ? explorePersonRoleLabel(person.role) : null;
  const showHostRow =
    Boolean(hostName || card.hostAvatar) &&
    (card.source === 'activity' ||
      card.source === 'shop' ||
      (card.source === 'demand' && participants.length === 0));

  if (!showHostRow && participants.length === 0) return null;

  const hostRow = showHostRow && hostName ? (
    hostPath ? (
      <Link
        to={hostPath}
        className="flex items-center gap-3 group rounded-xl -mx-1 px-1 py-1 hover:bg-neutral-50 transition-colors"
      >
        <SecureAvatar
          src={card.hostAvatar}
          name={hostName}
          className="h-10 w-10 text-sm ring-2 ring-white shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 truncate">{hostName}</p>
          <p className="text-xs text-gray-500">
            {personRoleLabel
              ? `${personRoleLabel} · view profile`
              : card.source === 'demand'
                ? 'Posted this request · view profile'
                : card.source === 'shop'
                  ? 'Shop contact · view profile'
                  : 'Host · view profile'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
      </Link>
    ) : (
      <div className="flex items-center gap-3">
        <SecureAvatar
          src={card.hostAvatar}
          name={hostName}
          className="h-10 w-10 text-sm ring-2 ring-white"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{hostName}</p>
          <p className="text-xs text-gray-500">
            {personRoleLabel ?? (card.source === 'demand' ? 'Posted this request' : card.source === 'shop' ? 'Shop contact' : 'Organisation')}
          </p>
        </div>
      </div>
    )
  ) : null;

  return (
    <div className="mt-5 border-t border-neutral-100 pt-4 space-y-4">
      {hostRow}
      {participants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Who&apos;s going ({participants.length})
          </p>
          <ParticipantPreview participants={participants} size="md" linkToProfile />
        </div>
      )}
    </div>
  );
};

export const ExploreCardTypeBadge = ({
  card,
  size = 'md',
}: {
  card: ExploreCardModel;
  size?: 'sm' | 'md';
}) => {
  const sizeClass = size === 'sm' ? 'h-11 w-11 text-xl' : 'h-12 w-12 text-2xl';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-emoji ${sizeClass} ${exploreCardToneClass[card.tone]}`}
    >
      {card.emoji}
    </span>
  );
};

/** Venue image overlays — kids friendly (left), difficulty or surface type (right). */
export const ExploreVenueImageBadges = ({ card }: { card: ExploreCardModel }) => {
  if (card.source !== 'venue') return null;

  const rightBadge =
    card.kind === 'hiking' && card.difficulty
      ? capitalize(card.difficulty)
      : card.kind === 'camping' && card.surfaceTypes && card.surfaceTypes.length > 0
        ? card.surfaceTypes.map(capitalize).join(' · ')
        : null;

  if (!card.childFriendly && !rightBadge) return null;

  return (
    <>
      {card.childFriendly ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-sm">
          Kids friendly
        </span>
      ) : null}
      {rightBadge ? (
        <span className="absolute right-14 top-3 max-w-[55%] truncate rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 backdrop-blur-sm">
          {rightBadge}
        </span>
      ) : null}
    </>
  );
};

export const ExploreCardCapacityRow = ({ card }: { card: ExploreCardModel }) => {
  const label = card.sections.partyLabel;
  if (!label) return null;

  return (
    <p className="mt-3 text-sm text-gray-600">
      <span className="font-medium">{label}</span>
    </p>
  );
};

