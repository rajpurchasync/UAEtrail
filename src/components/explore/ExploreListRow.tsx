import { CalendarDays, MapPin } from 'lucide-react';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { exploreCardToneClass } from '../../explore/exploreCardModel';
import { formatRelativeDayShort } from '../../explore/exploreCopy';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

interface ExploreListRowProps {
  card: ExploreCardModel;
  item: ExploreMapItemDTO;
  onClick: () => void;
}

export const ExploreListRow = ({ card, item, onClick }: ExploreListRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 border-b border-neutral-100 py-3 text-left"
  >
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-emoji text-2xl ${exploreCardToneClass[card.tone]}`}
    >
      {card.emoji}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold text-gray-900">{card.headline}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {item.date ? (
          <>
            <CalendarDays className="h-3 w-3" />
            {formatRelativeDayShort(item.date)}
          </>
        ) : card.subtitle ? (
          <>
            <MapPin className="h-3 w-3" />
            {card.subtitle}
          </>
        ) : null}
        {card.price && (
          <span className="font-semibold text-gray-600">{card.price.badge}</span>
        )}
        {card.spotsLabel && <span>{card.spotsLabel}</span>}
      </span>
    </span>
    <span className="text-gray-300">›</span>
  </button>
);
