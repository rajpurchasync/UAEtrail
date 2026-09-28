import { ChevronRight } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import { buildExploreListMeta, exploreCardToneTextClass } from '../exploreCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { ExploreCardDetailList, ExploreCardLocationLink, ExploreCardRatingRow, ExploreCardRequirementBadges } from './ExploreCardPresentation';
import { ExploreCardTypeIcon } from './ExploreCardTypeIcon';

interface ExploreListRowProps {
  card: ExploreCardModel;
  onClick: () => void;
}

const rowShellClass =
  'rounded-2xl border border-neutral-200/75 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-black/[0.02] transition';

const rowMainClass =
  'flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.995] active:bg-neutral-50/80';

export const ExploreListRow = ({ card, onClick }: ExploreListRowProps) => {
  const { listTitle, details, highlightName, suffix, activityHighlight, dateHighlight } = card.sections;
  const meta = buildExploreListMeta(card);
  const toneTextClass = exploreCardToneTextClass[card.tone];
  const isCatalogRow = card.source === 'shop' || card.source === 'agency' || card.source === 'venue';

  const iconCell = card.coverImage ? (
    <div className="relative h-14 w-14 shrink-0">
      <EnvironmentImage
        src={card.coverImage}
        alt=""
        className="h-14 w-14 rounded-xl object-cover ring-1 ring-neutral-200/80"
        loading="lazy"
      />
      <span className="absolute -bottom-1 -right-1 rounded-full shadow-sm ring-2 ring-white">
        <ExploreCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
        />
      </span>
    </div>
  ) : (
    <ExploreCardTypeIcon tone={card.tone} source={card.source} kind={card.kind} emoji={card.emoji} size="sm" />
  );

  const titleBlock = highlightName ? (
    <p className="truncate text-[15px] font-bold leading-snug text-gray-900">
      <span>{highlightName}</span>
      {suffix && <span>{suffix}</span>}
      {activityHighlight && <span className={toneTextClass}>{activityHighlight}</span>}
      {dateHighlight && <span>{dateHighlight}</span>}
    </p>
  ) : (
    <p className="truncate text-[15px] font-bold leading-snug text-gray-900">{listTitle}</p>
  );

  if (isCatalogRow) {
    return (
      <div className={rowShellClass}>
        <button type="button" onClick={onClick} className={`${rowMainClass} rounded-t-2xl`}>
          {iconCell}
          <span className="min-w-0 flex-1">{titleBlock}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
        </button>
        <div className="space-y-0 px-3 pb-3 pl-[4.25rem]">
          {card.subtitle ? (
            <ExploreCardLocationLink
              label={card.subtitle}
              latitude={card.mapLatitude}
              longitude={card.mapLongitude}
              className="text-sm text-gray-600"
            />
          ) : null}
          <ExploreCardRatingRow card={card} compact />
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${rowShellClass} ${rowMainClass}`}>
      {iconCell}
      <span className="min-w-0 flex-1">
        {titleBlock}
        {meta ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{meta}</p>
        ) : (
          <ExploreCardDetailList details={details} compact />
        )}
        {card.source === 'activity' && card.requirementBadges && card.requirementBadges.length > 0 ? (
          <div className="mt-2">
            <ExploreCardRequirementBadges badges={card.requirementBadges} />
          </div>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
    </button>
  );
};
