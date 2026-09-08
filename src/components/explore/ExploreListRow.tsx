import { ChevronRight } from 'lucide-react';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { buildExploreListMeta } from '../../explore/exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { ExploreCardDetailList, ExploreCardTypeBadge } from './ExploreCardPresentation';

interface ExploreListRowProps {
  card: ExploreCardModel;
  item: ExploreMapItemDTO;
  onClick: () => void;
}

export const ExploreListRow = ({ card, onClick }: ExploreListRowProps) => {
  const { listTitle, details } = card.sections;
  const meta = buildExploreListMeta(card);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-neutral-100 py-4 text-left last:border-b-0"
    >
      <ExploreCardTypeBadge card={card} size="sm" />

      <span className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-snug text-gray-900">{listTitle}</p>
        {meta ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{meta}</p>
        ) : (
          <ExploreCardDetailList details={details} compact />
        )}
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
    </button>
  );
};
