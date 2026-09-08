import { Clock, MapPin, Route, Tag, Users } from 'lucide-react';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { exploreCardToneClass } from '../../explore/exploreCardModel';
import type { ExploreCardDetail, ExploreCardDetailIcon, ExploreCardSections } from '../../explore/exploreCopy';
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
}: {
  sections: ExploreCardSections;
  size?: 'sm' | 'lg';
}) => {
  const textClass = size === 'lg' ? 'text-xl font-bold leading-snug' : 'text-[15px] font-semibold leading-snug';

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
        <span className="font-semibold text-gray-800">{sections.highlightName}</span>
        {sections.suffix && <span className="font-normal text-gray-700">{sections.suffix}</span>}
      </p>
    );
  }

  return null;
};

/** Secondary facts — muted, spaced, never crammed into the title. */
export const ExploreCardDetailList = ({
  details,
  compact = false,
}: {
  details: ExploreCardDetail[];
  compact?: boolean;
}) => {
  if (details.length === 0) return null;

  if (compact) {
    return (
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {details.map((detail) => detail.label).join(' · ')}
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2.5">
      {details.map((detail) => {
        const Icon = detailIcon(detail.icon);
        return (
          <li
            key={`${detail.icon}-${detail.label}`}
            className="flex items-start gap-2.5 text-sm leading-snug text-gray-600"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <span>{detail.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export const ExploreCardPeopleRow = ({ card }: { card: ExploreCardModel }) => {
  const participants = card.participantPreviews ?? [];
  const hostName = card.listHost ?? card.sections.hostName ?? card.sections.highlightName;
  const showHostOnly = card.source === 'demand' && participants.length === 0 && hostName;

  if (!showHostOnly && participants.length === 0) return null;

  return (
    <div className="mt-5 border-t border-neutral-100 pt-4">
      {participants.length > 0 ? (
        <ParticipantPreview participants={participants} size="md" />
      ) : (
        <div className="flex items-center gap-3">
          <SecureAvatar
            src={card.hostAvatar}
            name={hostName ?? 'Member'}
            className="h-10 w-10 text-sm ring-2 ring-white"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{hostName}</p>
            <p className="text-xs text-gray-500">Posted this request</p>
          </div>
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

export const ExploreCardCapacityRow = ({ card }: { card: ExploreCardModel }) => {
  const label = card.sections.partyLabel;
  if (!label) return null;

  return (
    <p className="mt-3 text-sm text-gray-600">
      <span className="font-medium">{label}</span>
    </p>
  );
};

